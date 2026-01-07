from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, Any, List

@dataclass
class RoomStore:
    rooms: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    events: List[Dict[str, Any]] = field(default_factory=list)

    def upsert_room(self, room_id: str, payload: Dict[str, Any]):
        self.rooms[room_id] = payload

    def get_rooms_sorted(self):
        # Primary sort: risk_score desc; fallback: priority desc
        def key_fn(r):
            return (r.get("risk_score", 0), r.get("priority", 0))
        return sorted(self.rooms.values(), key=key_fn, reverse=True)

    def get_room(self, room_id: str):
        return self.rooms.get(room_id)

    def add_event(self, event: Dict[str, Any]):
        self.events.append(event)

    def recent_events(self, room_id: str = None, minutes: int = 60):
        cutoff = datetime.utcnow() - timedelta(minutes=minutes)
        out = []
        for e in self.events:
            if e.get("ts") < cutoff:
                continue
            if room_id and e.get("room_id") != room_id:
                continue
            out.append(e)
        return out
