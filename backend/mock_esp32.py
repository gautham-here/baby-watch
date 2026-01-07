import json
import time
import random
import paho.mqtt.publish as publish

MQTT_HOST = "localhost"
MQTT_PORT = 1883
MQTT_PREFIX = "babywatch"

ROOM_TEMPLATES = [
    {"id": "A", "room": "Play Room"},
    {"id": "B", "room": "Nap Room"},
    {"id": "C", "room": "Feeding Room"}
]

def gen_payload():
    tmpl = random.choice(ROOM_TEMPLATES)
    state = random.choices(["SAFE", "MONITOR", "ATTENTION"], weights=[0.7, 0.2, 0.1])[0]
    return {
        **tmpl,
        "state": state,
        "priority": {"SAFE": 1, "MONITOR": 2, "ATTENTION": 3}[state],
        "zone": random.choice(["NONE", "Z1", "Z2"]),
        "cry_prob": round(random.uniform(0, 0.95), 2),
        "cry_sustained": random.random() < 0.08,
        "motion_zone1": random.random() < 0.25,
        "motion_zone2": random.random() < 0.35,
        "diaper_min": random.randint(45, 220),
        "diaper_overdue": random.randint(45, 220) > 185,
        "last_update_ms": int(time.time() * 1000)
    }

print("🚀 Mock ESP32 data → MQTT (Ctrl+C to stop)")
try:
    while True:
        payload = gen_payload()
        topic = f"{MQTT_PREFIX}/{payload['id']}/status"
        publish.single(topic, json.dumps(payload), hostname=MQTT_HOST, port=MQTT_PORT)
        print(f"📡 {topic}: {payload['room']} → {payload['state']}")
        time.sleep(2.0)
except KeyboardInterrupt:
    print("🛑 Mock stopped")
