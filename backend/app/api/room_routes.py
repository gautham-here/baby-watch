from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt

bp = Blueprint("rooms", __name__)

def role_allowed(claims, allowed):
    return claims.get("role") in allowed or claims.get("role") == "admin"

def register_room_routes(bp, store, mqtt_service):
    @bp.get("/rooms")
    @jwt_required()
    def rooms():
        return jsonify(store.get_rooms_sorted())

    @bp.get("/rooms/<room_id>")
    @jwt_required()
    def room(room_id):
        r = store.get_room(room_id)
        if not r:
            return jsonify({"msg": "Room not found"}), 404
        return jsonify(r)

    @bp.post("/rooms/<room_id>/acknowledge")
    @jwt_required()
    def acknowledge(room_id):
        claims = get_jwt()
        if not role_allowed(claims, {"parent", "caretaker"}):
            return jsonify({"msg": "Forbidden"}), 403

        r = store.get_room(room_id)
        if not r:
            return jsonify({"msg": "Room not found"}), 404

        mqtt_service.acknowledge(room_id)
        r = dict(r)
        r["acknowledged"] = True
        store.upsert_room(room_id, r)
        return jsonify({"ok": True, "room": r})

    @bp.get("/insights")
    @jwt_required()
    def insights():
        # simple global insights (room-only)
        rooms = store.get_rooms_sorted()
        anomalies = [r for r in rooms if r.get("anomaly")]
        top = rooms[:3]
        return jsonify({
            "top_risk": [{"id": r.get("id"), "room": r.get("room"), "risk_score": r.get("risk_score")} for r in top],
            "anomalies": [{"id": r.get("id"), "room": r.get("room")} for r in anomalies],
        })
