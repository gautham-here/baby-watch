import React, { useState } from "react";
import { authApi } from "../api/auth";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("parent1");
  const [password, setPassword] = useState("parent123");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const res = await authApi.login(username, password);
      onLogin({ token: res.data.access_token, role: res.data.role, name: res.data.name });
    } catch (e2) {
      setErr(e2?.response?.data?.msg || "Login failed");
    }
  };

  return (
    <div className="center">
      <form className="card" onSubmit={submit}>
        <h2>BabyWatch</h2>
        <p className="muted">Demo users: parent1/parent123, caretaker1/caretaker123, admin1/admin123</p>

        <label>Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} />

        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        {err && <div className="error">{err}</div>}
        <button className="btn" type="submit">Login</button>
      </form>
    </div>
  );
}
