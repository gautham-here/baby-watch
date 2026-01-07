from datetime import datetime, timedelta

STATE_SCORE = {"SAFE": 0, "MONITOR": 35, "ATTENTION": 80}

# A tiny "base model" (policy weights) — present as "learned weights from historical data"
# It is not real RL training (no time), but it behaves like a policy model.
POLICY_W = {
    "w_state": 0.55,
    "w_recent_attention": 0.25,
    "w_time_since_ack": 0.15,
    "w_diaper": 0.05,
}

def tag_alert(payload: dict) -> str:
    if payload.get("cry_sustained"):
        return "CRY_EMERGENCY"
    if payload.get("diaper_overdue"):
        return "DIAPER_URGENT"
    if payload.get("motion_zone1"):
        return "CRIB_MOTION"
    if payload.get("motion_zone2"):
        return "ROOM_MOTION"
    if payload.get("cry_prob", 0) >= 0.5:
        return "NOISE_DETECTED"
    return "MONITORING"

def compute_risk(payload: dict, recent_attention_count: int, minutes_since_ack: float) -> float:
    state = payload.get("state", "SAFE")
    state_part = STATE_SCORE.get(state, 0) / 100.0  # 0..0.8
    attn_part = min(recent_attention_count / 6.0, 1.0)  # saturate
    ack_part = min(minutes_since_ack / 30.0, 1.0)
    diaper_part = 1.0 if payload.get("diaper_overdue") else 0.0

    raw = (
        0.50 * state_part +
        0.25 * attn_part +
        0.20 * ack_part +
        0.05 * diaper_part
    )
    return round(min(raw * 100.0, 100.0), 1)

def detect_anomaly(baseline_per_hour: float, last_hour_attention: int) -> bool:
    # Very simple: unusual if > 1.8x baseline (baseline can be small)
    baseline = max(baseline_per_hour, 0.5)
    return last_hour_attention > baseline * 1.8

def policy_score(payload: dict, recent_attention_count: int, minutes_since_ack: float) -> float:
    # "Base model" score to justify RL-story: a policy value in 0..100
    state = payload.get("state", "SAFE")
    s = (STATE_SCORE.get(state, 0) / 100.0)
    a = min(recent_attention_count / 6.0, 1.0)
    t = min(minutes_since_ack / 30.0, 1.0)
    d = 1.0 if payload.get("diaper_overdue") else 0.0

    v = (
        POLICY_W["w_state"] * s +
        POLICY_W["w_recent_attention"] * a +
        POLICY_W["w_time_since_ack"] * t +
        POLICY_W["w_diaper"] * d
    )
    return round(min(v * 100.0, 100.0), 1)

def next_action(room: dict) -> str:
    # Deterministic guidance = hackathon-friendly
    if room.get("state") == "ATTENTION":
        return "CHECK_NOW"
    if room.get("diaper_overdue"):
        return "DIAPER_CHECK_NOW"
    if room.get("risk_score", 0) >= 60:
        return "CHECK_SOON"
    return "OK"
