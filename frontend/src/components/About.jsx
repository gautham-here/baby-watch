import React from "react";
import { useNavigate } from "react-router-dom";

export default function About() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "16px",
      background: "linear-gradient(135deg, #0d1117 0%, #161b22 100%)"
    }}>
      <div className="card" style={{ maxWidth: "600px", width: "100%" }}>
        <div className="card-header">
          <h3>About BabyWatch</h3>
        </div>
        <div className="card-body">
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "13px", color: "#e6edf3" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>What is BabyWatch?</div>
              <div style={{ color: "#8b949e" }}>
                BabyWatch is an intelligent multi-room baby monitoring system using AI-driven insights to help caretakers and parents provide better care. Using ESP32 microcontrollers with TinyML edge computing, BabyWatch monitors cry detection, motion, and diaper status across multiple rooms.
              </div>
            </div>

            <div>
              <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>Key Features</div>
              <ul style={{ marginLeft: "20px", color: "#8b949e", lineHeight: "1.8" }}>
                <li>Real-time room monitoring with continuous risk scoring</li>
                <li>AI-powered anomaly detection for unusual activities</li>
                <li>Smart caretaker guidance and action recommendations</li>
                <li>Policy-based room prioritization</li>
                <li>Multi-user roles: Parent, Caretaker, Admin</li>
                <li>Live dashboards with instant alerts</li>
                <li>Privacy-first (room-only data, no child identifiers)</li>
              </ul>
            </div>

            <div>
              <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>Technology Stack</div>
              <div style={{ color: "#8b949e", fontFamily: "monospace", fontSize: "12px" }}>
                Hardware: ESP32 + TinyML (Edge Impulse)<br/>
                Backend: Flask + MQTT + Socket.IO<br/>
                Frontend: React + Vite<br/>
                Real-time: WebSocket (Socket.IO)<br/>
                Database: In-memory (production: PostgreSQL)
              </div>
            </div>

            <div style={{ borderTop: "1px solid #30363d", paddingTop: "12px" }}>
              <div style={{ fontSize: "12px", color: "#6e7681" }}>
                Version 1.0.0 | © 2026 BabyWatch | Built with ❤️ for better childcare
              </div>
            </div>
          </div>

          <button className="btn primary" style={{ width: "100%", marginTop: "12px" }} onClick={() => navigate("/login")}>
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
