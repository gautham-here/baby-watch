"""
BabyWatch Device Simulator
Accepts:
- WiFi HTTP POST from ESP32: POST /api/devices/telemetry
- Serial bridge from ESP32: reads JSON → MQTT
- Mock data via CLI: python device_simulator.py --mock
"""

import json
import time
from datetime import datetime, timedelta
import paho.mqtt.publish as publish
import random

MQTT_HOST = "localhost"
MQTT_PORT = 1883
MQTT_PREFIX = "babywatch"

# Realistic room patterns (not random)
ROOM_PATTERNS = {
    "A": {  # Play Room - high activity
        "name": "Play Room",
        "baseline_alerts_per_hour": 3,
        "peak_hours": [15, 16, 17],  # 3-5 PM
        "cry_freq": 0.3,
        "motion_freq": 0.5,
        "motion_zones": ["Z1", "Z2"]
    },
    "B": {  # Nap Room - low activity, sudden spikes
        "name": "Nap Room",
        "baseline_alerts_per_hour": 0.5,
        "peak_hours": [13, 14, 20, 21],  # Nap times
        "cry_freq": 0.6,  # More likely to cry when waking
        "motion_freq": 0.2,
        "motion_zones": ["Z1"]
    },
    "C": {  # Feeding Room - routine-based
        "name": "Feeding Room",
        "baseline_alerts_per_hour": 1.5,
        "peak_hours": [9, 12, 15, 18],  # Feeding times
        "cry_freq": 0.2,
        "motion_freq": 0.3,
        "motion_zones": ["Z1"]
    }
}

class SmoothDeviceSimulator:
    def __init__(self):
        self.room_states = {}
        self.event_history = {}
        self.last_state = {}
        self.transitions = {}
        
        for room_id in ROOM_PATTERNS:
            self.room_states[room_id] = "SAFE"
            self.event_history[room_id] = []
            self.last_state[room_id] = "SAFE"
            self.transitions[room_id] = {"time": time.time(), "count": 0}
    
    def get_realistic_payload(self, room_id):
        """Generate smooth, realistic data based on time-of-day patterns"""
        pattern = ROOM_PATTERNS[room_id]
        now = datetime.now()
        hour = now.hour
        
        # Check if in peak hours
        in_peak = hour in pattern["peak_hours"]
        
        # Smooth state transitions (not abrupt)
        prev_state = self.room_states[room_id]
        time_in_state = time.time() - self.transitions[room_id]["time"]
        
        # Probability of state change (smoother than random)
        if prev_state == "SAFE":
            # SAFE → MONITOR (lower prob)
            change_prob = 0.05 if not in_peak else 0.15
        elif prev_state == "MONITOR":
            # MONITOR → ATTENTION or back to SAFE
            change_prob = 0.08 if not in_peak else 0.25
        else:  # ATTENTION
            # ATTENTION → MONITOR (often returns to calm after alert)
            change_prob = 0.4 if time_in_state > 30 else 0.05
        
        # Determine next state
        if random.random() < change_prob and time_in_state > 5:
            if prev_state == "SAFE":
                new_state = "MONITOR"
            elif prev_state == "MONITOR":
                new_state = "ATTENTION" if random.random() < 0.4 else "SAFE"
            else:
                new_state = "MONITOR"
            
            self.room_states[room_id] = new_state
            self.transitions[room_id] = {"time": time.time(), "count": self.transitions[room_id]["count"] + 1}
        else:
            new_state = self.room_states[room_id]
        
        # Sensor data correlates with state
        if new_state == "SAFE":
            cry_prob = random.uniform(0.0, 0.2)
            motion_z1 = random.random() < 0.1
            motion_z2 = random.random() < 0.05
            diaper_min = random.randint(60, 150)
        elif new_state == "MONITOR":
            cry_prob = random.uniform(0.3, 0.65)
            motion_z1 = random.random() < 0.4
            motion_z2 = random.random() < 0.2
            diaper_min = random.randint(120, 180)
        else:  # ATTENTION
            cry_prob = random.uniform(0.7, 0.95)
            motion_z1 = random.random() < 0.7
            motion_z2 = random.random() < 0.5
            diaper_min = random.randint(150, 240)
        
        cry_sustained = cry_prob > 0.7
        diaper_overdue = diaper_min > 185
        
        return {
            "id": room_id,
            "room": pattern["name"],
            "state": new_state,
            "priority": {"SAFE": 1, "MONITOR": 2, "ATTENTION": 3}[new_state],
            "zone": random.choice(pattern["motion_zones"]) if (motion_z1 or motion_z2) else "NONE",
            "cry_prob": round(cry_prob, 2),
            "cry_sustained": cry_sustained,
            "motion_zone1": motion_z1,
            "motion_zone2": motion_z2,
            "diaper_min": diaper_min,
            "diaper_overdue": diaper_overdue,
            "last_update_ms": int(time.time() * 1000)
        }

simulator = SmoothDeviceSimulator()

def publish_payload(room_id):
    """Publish single room payload to MQTT"""
    payload = simulator.get_realistic_payload(room_id)
    topic = f"{MQTT_PREFIX}/{room_id}/status"
    publish.single(topic, json.dumps(payload), hostname=MQTT_HOST, port=MQTT_PORT)
    print(f"📡 {topic}: {payload['room']} → {payload['state']} (cry_prob={payload['cry_prob']}, diaper={payload['diaper_min']}m)")
    return payload

print("""
BabyWatch Device Simulator
==========================
Modes:
  1. Mock data (smooth + realistic): python device_simulator.py --mock
  2. Serial bridge (from real ESP32): python bridge.py --port COM3
  3. WiFi HTTP (from ESP32 WiFi): Backend accepts POST /api/devices/telemetry
Press Ctrl+C to stop
""")

if __name__ == "__main__":
    import sys
    
    if "--mock" in sys.argv:
        print("🚀 Mock mode (smooth data) - Ctrl+C to stop\n")
        try:
            while True:
                for room_id in ROOM_PATTERNS:
                    publish_payload(room_id)
                    time.sleep(1)  # Stagger room publishes
                time.sleep(1)  # 1s between cycles (2s total per room)
        except KeyboardInterrupt:
            print("\n🛑 Simulator stopped")
    else:
        print("Usage: python device_simulator.py --mock")
