"use client";

import { useState, useEffect } from "react";

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;

  const dateStr = time.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div>
      <style>{`
        @keyframes blink-colon {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
      <div className="clock-time" style={{ fontSize: '3rem' }}>
        {displayHour}
        <span style={{ animation: 'blink-colon 1s ease-in-out infinite' }}>:</span>
        {minutes}
        <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: '6px' }}>{ampm}</span>
      </div>
      <div className="clock-date" style={{ fontSize: '0.9rem' }}>{dateStr}</div>
    </div>
  );
}
