import React, { useEffect, useState } from "react";
import { authApi } from "./api/auth";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import "./styles.css";

export default function App() {
  const [session, setSession] = useState({ ok: false, role: null, name: null, loading: true });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return setSession(s => ({ ...s, loading: false }));

    authApi.me()
      .then(res => setSession({ ok: true, role: res.data.role, name: res.data.name, loading: false }))
      .catch(() => {
        localStorage.clear();
        setSession({ ok: false, role: null, name: null, loading: false });
      });
  }, []);

  const onLogin = ({ token, role, name }) => {
    localStorage.setItem("token", token);
    setSession({ ok: true, role, name, loading: false });
  };

  const onLogout = () => {
    localStorage.clear();
    setSession({ ok: false, role: null, name: null, loading: false });
  };

  if (session.loading) return <div className="center">Loading...</div>;
  return session.ok
    ? <Dashboard session={session} onLogout={onLogout} />
    : <Login onLogin={onLogin} />;
}
