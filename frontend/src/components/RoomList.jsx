import React from "react";

export default function RoomList({ rooms, selectedId, onSelect }) {
  return (
    <div className="card" style={{ height: "fit-content", maxHeight: "calc(100vh - 120px)" }}>
      <div className="card-header">
        <h3>Rooms ({rooms.length})</h3>
      </div>
      <div className="card-body" style={{ gap: "6px" }}>
        {rooms.length === 0 ? (
          <div className="loading" style={{ height: "100px" }}>Waiting for data...</div>
        ) : (
          rooms.map(room => (
            <div
              key={room.id}
              className={`room-item state-${room.state.toLowerCase()} ${selectedId === room.id ? "selected" : ""}`}
              onClick={() => onSelect(room.id)}
            >
              <div className="room-item-header">
                <div className="room-name">{room.room} <span style={{ fontSize: "11px", color: "#6e7681" }}>({room.id})</span></div>
                <div className="room-meta">
                  {room.alert_tag} • {room.recent_attention_30m} alerts
                </div>
              </div>
              <div className="room-score">
                <div className="score-value">{room.risk_score}</div>
                <div className="score-label">Risk</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
