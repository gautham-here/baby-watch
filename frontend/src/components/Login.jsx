import React, { useState } from "react";
import { authApi } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("parent1");
  const [password, setPassword] = useState("parent123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authApi.login(username, password);
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("username", username);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "16px",
      background: "linear-gradient(135deg, #0d1117 0%, #161b22 100%)"
    }}>
      <div className="card" style={{ maxWidth: "360px", width: "100%" }}>
        <div className="card-body" style={{ gap: "16px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "28px", fontWeight: "700", color: "#58a6ff", marginBottom: "4px" }}>
              BabyWatch
            </div>
            <div style={{ fontSize: "12px", color: "#8b949e" }}>
              Smart Baby Monitoring System
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Username</label>
              <input
                className="input-field"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="parent1"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                className="input-field"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button className="btn primary" type="submit" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div style={{ borderTop: "1px solid #30363d", paddingTop: "12px" }}>
            <div style={{ fontSize: "11px", fontWeight: "600", color: "#8b949e", textTransform: "uppercase", marginBottom: "8px" }}>
              Demo Accounts
            </div>
            <div style={{ fontSize: "12px", color: "#e6edf3", lineHeight: "1.6", fontFamily: "monospace" }}>
              parent1 / parent123<br/>
              caretaker1 / caretaker123<br/>
              admin1 / admin123
            </div>
          </div>

          <button className="btn" style={{ width: "100%" }} onClick={() => navigate("/register")}>
            Create Account
          </button>
          <button className="btn" style={{ width: "100%" }} onClick={() => navigate("/about")}>
            About BabyWatch
          </button>
        </div>
      </div>
    </div>
  );
}
