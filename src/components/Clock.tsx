"use client";

import { useState, useEffect } from "react";

export default function Clock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Render a stable placeholder until mounted (avoids SSR/client mismatch).
  const hours = time ? time.getHours() : 0;
  const minutes = time ? String(time.getMinutes()).padStart(2, "0") : "00";
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return (
    <div className="clock-time" aria-label="Current time">
      <span style={{ visibility: time ? "visible" : "hidden" }}>
        {displayHour}
        <span className="blink-colon">:</span>
        {minutes}
      </span>
      <span className="clock-ampm">{ampm}</span>
    </div>
  );
}
