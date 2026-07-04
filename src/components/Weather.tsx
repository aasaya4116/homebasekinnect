"use client";

import { useState, useEffect } from "react";

// WMO Weather interpretation codes → description + emoji
const WMO_CODES: Record<number, { description: string; emoji: string }> = {
  0: { description: "Clear", emoji: "☀️" },
  1: { description: "Mostly Clear", emoji: "🌤️" },
  2: { description: "Partly Cloudy", emoji: "⛅" },
  3: { description: "Overcast", emoji: "☁️" },
  45: { description: "Foggy", emoji: "🌫️" },
  48: { description: "Icy Fog", emoji: "🌫️" },
  51: { description: "Light Drizzle", emoji: "🌦️" },
  53: { description: "Drizzle", emoji: "🌦️" },
  55: { description: "Heavy Drizzle", emoji: "🌧️" },
  56: { description: "Freezing Drizzle", emoji: "🌧️" },
  57: { description: "Heavy Freezing Drizzle", emoji: "🌧️" },
  61: { description: "Light Rain", emoji: "🌦️" },
  63: { description: "Rain", emoji: "🌧️" },
  65: { description: "Heavy Rain", emoji: "🌧️" },
  66: { description: "Freezing Rain", emoji: "🧊" },
  67: { description: "Heavy Freezing Rain", emoji: "🧊" },
  71: { description: "Light Snow", emoji: "🌨️" },
  73: { description: "Snow", emoji: "❄️" },
  75: { description: "Heavy Snow", emoji: "❄️" },
  77: { description: "Snow Grains", emoji: "❄️" },
  80: { description: "Light Showers", emoji: "🌦️" },
  81: { description: "Showers", emoji: "🌧️" },
  82: { description: "Heavy Showers", emoji: "⛈️" },
  85: { description: "Snow Showers", emoji: "🌨️" },
  86: { description: "Heavy Snow Showers", emoji: "🌨️" },
  95: { description: "Thunderstorm", emoji: "⛈️" },
  96: { description: "Thunderstorm w/ Hail", emoji: "⛈️" },
  99: { description: "Thunderstorm w/ Heavy Hail", emoji: "⛈️" },
};

interface WeatherData {
  tempF: number;
  description: string;
  emoji: string;
}

// Atlanta, GA — change these to update location
const LATITUDE = 33.749;
const LONGITUDE = -84.388;
const REFRESH_MS = 30 * 60 * 1000; // 30 minutes

function decodeWeather(code: number): { description: string; emoji: string } {
  return WMO_CODES[code] ?? { description: "Unknown", emoji: "❓" };
}

export default function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchWeather() {
      try {
        const url =
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${LATITUDE}&longitude=${LONGITUDE}` +
          `&current=temperature_2m,weather_code` +
          `&temperature_unit=fahrenheit` +
          `&timezone=auto`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (cancelled) return;

        const tempF: number = data.current.temperature_2m;
        const code: number = data.current.weather_code;
        const { description, emoji } = decodeWeather(code);

        setWeather({ tempF: Math.round(tempF), description, emoji });
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      }
    }

    fetchWeather();
    const interval = setInterval(fetchWeather, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Compact inline display — matches Clock font sizes & colors
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      {error || !weather ? (
        <span
          style={{
            fontSize: "1.1rem",
            color: "var(--text-secondary)",
          }}
        >
          --
        </span>
      ) : (
        <>
          <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>
            {weather.emoji}
          </span>
          <span
            style={{
              fontSize: "1.2rem",
              fontWeight: 650,
              color: "var(--text-primary)",
            }}
          >
            {weather.tempF}°
          </span>
          <span
            style={{
              fontSize: "1rem",
              fontWeight: 500,
              color: "var(--text-secondary)",
            }}
          >
            {weather.description}
          </span>
        </>
      )}
    </div>
  );
}
