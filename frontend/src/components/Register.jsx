import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    role: "parent"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    // In production, make API call
    // For now, simulate registration
    setTimeout(() => {
      localStorage.setItem("registered_user", formData.username);
      navigate("/login");
    }, 500);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "16px",
      background: "linear-gradient(135deg, #0d1117 0%, #161b22 100%)"
    }}>
      <div className="card" style={{ maxWidth: "360px", width: "100%" }}>
        <div className="card-header">
          <h3>Create Account</h3>
        </div>
        <div className="card-body" style={{ gap: "12px" }}>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Username</label>
              <input
                className="input-field"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Email</label>
              <input
                className="input-field"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Role</label>
              <select
                className="input-field"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="parent">Parent</option>
                <option value="caretaker">Caretaker</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                className="input-field"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Confirm Password</label>
              <input
                className="input-field"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button className="btn primary" type="submit" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>

          <button className="btn" style={{ width: "100%" }} onClick={() => navigate("/login")}>
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
