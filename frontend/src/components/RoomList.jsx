import React from "react";

function stateClass(state) {
  if (state === "ATTENTION") return "attn";
  if (state === "MONITOR") return "mon";
  return "safe";
}

export default function RoomList({ rooms, selectedId, onSelect }) {
  return (
    <div className="card">
      <h3>Rooms (sorted by risk)</h3>
      <div className="list">
        {rooms.map(r => (
          <button
            key={r.id}
            className={`listItem ${stateClass(r.state)} ${selectedId === r.id ? "active" : ""}`}
            onClick={() => onSelect(r.id)}
          >
            <div className="row">
              <div>
                <div className="name">{r.room} <span className="muted">({r.id})</span></div>
                <div className="muted">Risk: {r.risk_score} | Policy: {r.policy_score} | {r.alert_tag}</div>
              </div>
              {r.anomaly && <div className="pill">ANOMALY</div>}
            </div>
          </button>
        ))}
        {rooms.length === 0 && <div className="muted">Waiting for MQTT data…</div>}
      </div>
    </div>
  );
}
