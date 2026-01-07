import React, { useMemo } from "react";

export default function InsightsPanel({ rooms }) {
  const top = rooms[0];
  const anomalies = useMemo(() => rooms.filter(r => r.anomaly), [rooms]);

  return (
    <div className="card mini">
      <div className="row">
        <div>
          <div className="muted">Top risk now</div>
          <div className="big">{top ? `${top.room} (${top.risk_score})` : "No rooms yet"}</div>
          {top && <div className="muted">Tag: {top.alert_tag} | Next: {top.next_action} | Policy: {top.policy_score}</div>}
        </div>
        <div className="badge">{top ? top.state : "-"}</div>
      </div>

      {anomalies.length > 0 && (
        <div className="warn">
          Unusual activity: {anomalies.map(a => a.room).join(", ")}
        </div>
      )}
    </div>
  );
}
