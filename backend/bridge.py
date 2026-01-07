#!/usr/bin/env python3
"""
BabyWatch Serial-MQTT Bridge
Reads JSON from ESP32 serial → publishes to MQTT
Run: python bridge.py --port /dev/ttyUSB0
"""

import argparse
import json
import logging
import sys
import time
from pathlib import Path

try:
    import serial
    import paho.mqtt.client as mqtt
except ImportError:
    print("Install: pip install pyserial paho-mqtt")
    sys.exit(1)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

DEFAULT_PORT = "/dev/ttyUSB0" if sys.platform != "win32" else "COM3"
DEFAULT_BAUD = 115200
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_PREFIX = "babywatch"

def on_mqtt_connect(client, userdata, flags, rc):
    if rc == 0:
        log.info("✅ Connected to MQTT broker")
    else:
        log.error(f"❌ MQTT connect failed (rc={rc})")

def bridge(port: str, baudrate: int):
    """Main bridge logic"""
    mqttc = mqtt.Client()
    mqttc.on_connect = on_mqtt_connect

    try:
        mqttc.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
        mqttc.loop_start()
        time.sleep(1)  # let it connect
    except Exception as e:
        log.error(f"❌ MQTT connect error: {e}")
        return

    try:
        ser = serial.Serial(
            port=port,
            baudrate=baudrate,
            timeout=1,
            bytesize=serial.EIGHTBITS,
            parity=serial.PARITY_NONE,
            stopbits=serial.STOPBITS_ONE
        )
        log.info(f"✅ Serial opened: {port} @ {baudrate}")
    except Exception as e:
        log.error(f"❌ Serial open failed: {port}: {e}")
        mqttc.loop_stop()
        return

    log.info("🔄 Bridge running… (Ctrl+C to stop)")
    msg_count = 0

    try:
        while True:
            line = ser.readline().decode("utf-8", errors="ignore").strip()
            if not line:
                continue

            if line.startswith("{"):
                try:
                    data = json.loads(line)
                    room_id = data.get("id", "UNKNOWN")
                    topic = f"{MQTT_PREFIX}/{room_id}/status"
                    mqttc.publish(topic, line, qos=1)
                    msg_count += 1
                    if msg_count % 10 == 0:
                        log.info(f"📡 Published {msg_count} msgs to {topic}")
                except json.JSONDecodeError:
                    # ESP32 debug lines, ignore
                    pass

    except KeyboardInterrupt:
        log.info("🛑 Bridge stopped by user")
    except Exception as e:
        log.error(f"❌ Bridge error: {e}")
    finally:
        ser.close()
        mqttc.loop_stop()
        mqttc.disconnect()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="BabyWatch Serial-MQTT Bridge")
    parser.add_argument("--port", "-p", default=DEFAULT_PORT, help=f"Serial port (default: {DEFAULT_PORT})")
    parser.add_argument("--baud", "-b", type=int, default=DEFAULT_BAUD, help=f"Baudrate (default: {DEFAULT_BAUD})")
    args = parser.parse_args()

    print(f"""
BabyWatch Serial-MQTT Bridge
============================
Port: {args.port}
Baud: {args.baud}
MQTT: {MQTT_BROKER}:{MQTT_PORT}
ESP32 JSON → babywatch/{room_id}/status
Press Ctrl+C to stop
    """)
    bridge(args.port, args.baud)
