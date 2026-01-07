import React, { useEffect, useMemo, useState } from "react";
import { makeSocket } from "../socket";
import { roomsApi } from "../api/rooms";
import RoomList from "./RoomList";
import RoomDetail from "./RoomDetail";
import InsightsPanel from "./InsightsPanel";

export default function Dashboard({ session, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    roomsApi.list().then(r => setRooms(r.data)).catch(() => {});
    const s = makeSocket();

    s.on("initial_state", (data) => setRooms(data));
    s.on("room_update", (room) => {
      setRooms(prev => {
        const m = new Map(prev.map(x => [x.id, x]));
        m.set(room.id, room);
        return Array.from(m.values()).sort((a,b) => (b.risk_score ?? 0) - (a.risk_score ?? 0));
      });
    });

    return () => s.disconnect();
  }, []);

  const selected = useMemo(() => rooms.find(r => r.id === selectedId) || rooms[0] || null, [rooms, selectedId]);

  return (
    <div className="layout">
      <header className="topbar">
        <div>
          <div className="title">BabyWatch Dashboard</div>
          <div className="muted">User: {session.name} ({session.role})</div>
        </div>
        <button className="btn danger" onClick={onLogout}>Logout</button>
      </header>

      <main className="grid">
        <section className="panel">
          <InsightsPanel rooms={rooms} />
          <RoomList rooms={rooms} selectedId={selected?.id} onSelect={setSelectedId} />
        </section>

        <section className="panel">
          <RoomDetail room={selected} role={session.role} onAck={async (id) => {
            await roomsApi.ack(id);
            const rr = await roomsApi.list();
            setRooms(rr.data);
          }} />
        </section>
      </main>
    </div>
  );
}
