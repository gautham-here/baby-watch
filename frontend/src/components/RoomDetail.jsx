import React from "react";
import { roomsApi } from "../api/rooms";

export default function RoomDetail({ room, role, onUpdate }) {
  if (!room) return <div className="card"><div className="card-body">Select a room</div></div>;

  const handleAck = async () => {
    await roomsApi.ack(room.id);
    onUpdate();
  };

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ flex: 1 }}>
          <h3>{room.room}</h3>
        </div>
        <span className={`badge state-${room.state.toLowerCase()}`}>{room.state}</span>
      </div>
      <div className="card-body">
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "11px", color: "#6e7681", textTransform: "uppercase", marginBottom: "4px" }}>Risk Score</div>
          <div className="risk-gauge">
            <div className="risk-gauge-fill" style={{ width: `${(room.risk_score / 100) * 100}%` }}></div>
          </div>
          <div style={{ fontSize: "16px", fontWeight: "700", color: "#58a6ff" }}>{room.risk_score}</div>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <div className="detail-label">Alert Tag</div>
            <div className="detail-value">{room.alert_tag}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Policy Score</div>
            <div className="detail-value">{room.policy_score}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Cry Prob</div>
            <div className="detail-value">{(room.cry_prob * 100).toFixed(0)}%</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Diaper Min</div>
            <div className="detail-value">{room.diaper_min}m</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Zone</div>
            <div className="detail-value">{room.zone}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Anomaly</div>
            <div className="detail-value">{room.anomaly ? "Yes 🚨" : "No"}</div>
          </div>
        </div>

        {room.anomaly && (
          <div className="alert warning" style={{ marginTop: "12px" }}>
            <span>🚨</span>
            <div>Unusual activity detected in this room</div>
          </div>
        )}

        {room.next_action && (
          <div className="alert info" style={{ marginTop: "12px" }}>
            <span>💡</span>
            <div><strong>Next Action:</strong> {room.next_action}</div>
          </div>
        )}

        {["parent", "caretaker", "admin"].includes(role) && (
          <button className="btn primary" style={{ width: "100%", marginTop: "12px" }} onClick={handleAck}>
            ✓ Acknowledge
          </button>
        )}
      </div>
    </div>
  );
}
