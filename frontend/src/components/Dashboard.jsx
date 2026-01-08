import React, { useEffect, useMemo, useState } from "react";
import { makeSocket } from "../socket";
import { roomsApi } from "../api/rooms";
import { useNavigate } from "react-router-dom";
import RoomList from "./RoomList";
import RoomDetail from "./RoomDetail";
import AdminDashboard from "./AdminDashboard";

export default function Dashboard() {
  const [rooms, setRooms] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [role, setRole] = useState(localStorage.getItem("role") || "parent");
  const [username, setUsername] = useState(localStorage.getItem("username") || "User");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");

    roomsApi.list().then(r => setRooms(r.data)).catch(() => {});

    const socket = makeSocket();
    socket.on("initial_state", (data) => setRooms(data));
    socket.on("room_update", (room) => {
      setRooms(prev => {
        const m = new Map(prev.map(x => [x.id, x]));
        m.set(room.id, room);
        return Array.from(m.values()).sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0));
      });
    });

    return () => socket.disconnect();
  }, [navigate]);

  const selected = useMemo(() => rooms.find(r => r.id === selectedId) || rooms[0] || null, [rooms, selectedId]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="app-container">
      <div className="topbar">
        <div className="topbar-left">
          <div className="topbar-logo">🍼 BabyWatch</div>
          <div className="topbar-user">
            <div className="topbar-username">{username}</div>
            <div className="topbar-role">{role}</div>
          </div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-small" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {role === "admin" ? (
        <AdminDashboard rooms={rooms} setSelectedId={setSelectedId} selected={selected} />
      ) : (
        <div className="main-grid">
          <RoomList rooms={rooms} selectedId={selected?.id} onSelect={setSelectedId} />
          <RoomDetail room={selected} role={role} onUpdate={() => roomsApi.list().then(r => setRooms(r.data))} />
        </div>
      )}
    </div>
  );
}
