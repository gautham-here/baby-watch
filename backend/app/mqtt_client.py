import json
from datetime import datetime, timedelta
import paho.mqtt.client as mqtt

from .extensions import socketio
from .ai_engine import compute_risk, tag_alert, detect_anomaly, policy_score, next_action
from .state_store import RoomStore

class BabyWatchMQTT:
    def __init__(self, app, store: RoomStore):
        self.app = app
        self.store = store
        self.client = mqtt.Client()

        self.topic_prefix = app.config["MQTT_TOPIC_PREFIX"]
        self.broker = app.config["MQTT_BROKER"]
        self.port = app.config["MQTT_PORT"]

        # baseline stats
        self.attention_history = {}  # room_id -> list[timestamps]
        self.last_ack = {}           # room_id -> datetime

        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message

    def on_connect(self, client, userdata, flags, rc):
        topic = f"{self.topic_prefix}/+/status"
        client.subscribe(topic)

    def _count_recent_attention(self, room_id: str, minutes: int) -> int:
        now = datetime.utcnow()
        cutoff = now - timedelta(minutes=minutes)
        ts_list = self.attention_history.get(room_id, [])
        return sum(1 for t in ts_list if t >= cutoff)

    def _baseline_per_hour(self, room_id: str) -> float:
        # Baseline from last 24h attention count
        last_24h = self._count_recent_attention(room_id, minutes=24*60)
        return last_24h / 24.0

    def _minutes_since_ack(self, room_id: str) -> float:
        t = self.last_ack.get(room_id)
        if not t:
            return 999.0
        return (datetime.utcnow() - t).total_seconds() / 60.0

    def on_message(self, client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode("utf-8"))
            room_id = payload.get("id")
            if not room_id:
                return

            now = datetime.utcnow()

            # Track attention events for stats
            if payload.get("state") == "ATTENTION":
                self.attention_history.setdefault(room_id, []).append(now)

            recent30 = self._count_recent_attention(room_id, minutes=30)
            last_hour = self._count_recent_attention(room_id, minutes=60)
            baseline = self._baseline_per_hour(room_id)
            minutes_since_ack = self._minutes_since_ack(room_id)

            # AI enrichment
            enriched = dict(payload)
            enriched["last_update_iso"] = now.isoformat() + "Z"
            enriched["alert_tag"] = tag_alert(payload)
            enriched["risk_score"] = compute_risk(payload, recent30, minutes_since_ack)
            enriched["policy_score"] = policy_score(payload, recent30, minutes_since_ack)
            enriched["recent_attention_30m"] = recent30
            enriched["anomaly"] = detect_anomaly(baseline, last_hour)
            enriched["next_action"] = next_action(enriched)

            self.store.upsert_room(room_id, enriched)

            # emit to UI
            socketio.emit("room_update", enriched)

        except Exception:
            # keep robust for demo; ignore malformed lines
            return

    def start(self):
        self.client.connect(self.broker, self.port, keepalive=60)
        self.client.loop_start()  # background thread [web:35]

    def stop(self):
        try:
            self.client.loop_stop()
            self.client.disconnect()
        except Exception:
            pass

    def acknowledge(self, room_id: str):
        self.last_ack[room_id] = datetime.utcnow()
