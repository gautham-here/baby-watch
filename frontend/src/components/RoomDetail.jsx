import React from "react";

export default function RoomDetail({ room, role, onAck }) {
  if (!room) return <div className="card">Select a room…</div>;

  const canAck = ["parent", "caretaker", "admin"].includes(role);

  return (
    <div className="card">
      <div className="row">
        <h2>{room.room} <span className="muted">({room.id})</span></h2>
        <div className="badge">{room.state}</div>
      </div>

      <div className="grid2">
        <div><b>Risk score:</b> {room.risk_score}</div>
        <div><b>Policy score:</b> {room.policy_score}</div>
        <div><b>Alert tag:</b> {room.alert_tag}</div>
        <div><b>Next action:</b> {room.next_action}</div>
        <div><b>Cry prob:</b> {room.cry_prob}</div>
        <div><b>Diaper min:</b> {room.diaper_min}</div>
        <div><b>Zone:</b> {room.zone}</div>
        <div><b>Anomaly:</b> {room.anomaly ? "Yes" : "No"}</div>
      </div>

      <div className="muted">Last update: {room.last_update_iso || "-"}</div>

      {canAck && (
        <button className="btn" onClick={() => onAck(room.id)}>
          Acknowledge / Visit
        </button>
      )}
    </div>
  );
}
