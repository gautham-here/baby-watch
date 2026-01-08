import React, { useMemo } from "react";
import RoomList from "./RoomList";
import RoomDetail from "./RoomDetail";

export default function AdminDashboard({ rooms, setSelectedId, selected }) {
  // Real statistics from actual project data
  const stats = useMemo(() => {
    const totalRooms = rooms.length;
    const attentionRooms = rooms.filter(r => r.state === "ATTENTION").length;
    const monitorRooms = rooms.filter(r => r.state === "MONITOR").length;
    const safeRooms = rooms.filter(r => r.state === "SAFE").length;
    const anomalousRooms = rooms.filter(r => r.anomaly).length;

    const avgRiskScore = totalRooms > 0 ? (rooms.reduce((sum, r) => sum + (r.risk_score || 0), 0) / totalRooms).toFixed(1) : 0;
    const maxRiskScore = totalRooms > 0 ? Math.max(...rooms.map(r => r.risk_score || 0)).toFixed(1) : 0;

    const avgCryProb = totalRooms > 0 ? (rooms.reduce((sum, r) => sum + (r.cry_prob || 0), 0) / totalRooms * 100).toFixed(0) : 0;
    const avgDiaperMin = totalRooms > 0 ? (rooms.reduce((sum, r) => sum + (r.diaper_min || 0), 0) / totalRooms).toFixed(0) : 0;

    return {
      totalRooms,
      attentionRooms,
      monitorRooms,
      safeRooms,
      anomalousRooms,
      avgRiskScore,
      maxRiskScore,
      avgCryProb,
      avgDiaperMin
    };
  }, [rooms]);

  return (
    <div className="main-grid admin">
      {/* Left: Room List */}
      <RoomList rooms={rooms} selectedId={selected?.id} onSelect={setSelectedId} />

      {/* Center: Room Detail */}
      <RoomDetail room={selected} role="admin" onUpdate={() => {}} />

      {/* Right: Statistics Panel */}
      <div className="card" style={{ height: "fit-content", maxHeight: "calc(100vh - 120px)" }}>
        <div className="card-header">
          <h3>Statistics</h3>
        </div>
        <div className="card-body" style={{ gap: "12px" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#6e7681", textTransform: "uppercase", marginBottom: "8px" }}>Room Status</div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.safeRooms}</div>
                <div className="stat-label">Safe</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: "#d29922" }}>{stats.monitorRooms}</div>
                <div className="stat-label">Monitor</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: "#f85149" }}>{stats.attentionRooms}</div>
                <div className="stat-label">Attention</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: "#f85149" }}>{stats.anomalousRooms}</div>
                <div className="stat-label">Anomalies</div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #30363d", paddingTop: "12px" }}>
            <div style={{ fontSize: "11px", color: "#6e7681", textTransform: "uppercase", marginBottom: "8px" }}>Risk Metrics</div>
            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-label">Avg Risk</div>
                <div className="detail-value">{stats.avgRiskScore}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Max Risk</div>
                <div className="detail-value">{stats.maxRiskScore}</div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #30363d", paddingTop: "12px" }}>
            <div style={{ fontSize: "11px", color: "#6e7681", textTransform: "uppercase", marginBottom: "8px" }}>Sensor Data</div>
            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-label">Avg Cry %</div>
                <div className="detail-value">{stats.avgCryProb}%</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Avg Diaper</div>
                <div className="detail-value">{stats.avgDiaperMin}m</div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #30363d", paddingTop: "12px", fontSize: "11px", color: "#8b949e" }}>
            <div>📊 Real data from {stats.totalRooms} active rooms</div>
            <div>🔄 Updates every 2 seconds</div>
            <div>📈 Data is computed, not generated</div>
          </div>
        </div>
      </div>
    </div>
  );
}
