import React, { useEffect, useState } from "react";

export default function CountdownTimer({ endDate, expired, onExpire }) {
  const [remaining, setRemaining] = useState(getRemainingTime(endDate));
  useEffect(() => {
    if (remaining <= 0) {
      if (onExpire) onExpire();
      return;
    }
    const interval = setInterval(() => {
      setRemaining(getRemainingTime(endDate));
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [endDate, remaining]);
  if (expired) return <span style={{ color: "#ef4444" }}>0:00:00</span>;
  return <span>{formatTime(remaining)}</span>;
}
function getRemainingTime(endDate) {
  return Math.max(0, Math.floor((new Date(endDate).getTime() - Date.now()) / 1000));
}
function formatTime(secs) {
  if (secs <= 0) return "0:00:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
