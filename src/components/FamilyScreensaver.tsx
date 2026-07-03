'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface FamilyScreensaverProps {
  photos: string[];
  idleTimeout?: number; // ms before screensaver activates (default: 2 min)
  slideDuration?: number; // ms per photo (default: 8 sec)
}

export default function FamilyScreensaver({
  photos,
  idleTimeout = 2 * 60 * 1000,
  slideDuration = 8000,
}: FamilyScreensaverProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [kenBurnsKey, setKenBurnsKey] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const slideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Randomize Ken Burns effect for each slide
  const getKenBurnsStyle = useCallback((index: number) => {
    const effects = [
      { from: 'scale(1) translate(0, 0)', to: 'scale(1.15) translate(-3%, -2%)' },
      { from: 'scale(1.1) translate(-2%, 0)', to: 'scale(1) translate(2%, 2%)' },
      { from: 'scale(1) translate(0, -2%)', to: 'scale(1.12) translate(2%, 0)' },
      { from: 'scale(1.15) translate(3%, 2%)', to: 'scale(1) translate(0, 0)' },
      { from: 'scale(1) translate(2%, 2%)', to: 'scale(1.1) translate(-2%, -2%)' },
      { from: 'scale(1.08) translate(-1%, 3%)', to: 'scale(1.02) translate(1%, -1%)' },
    ];
    return effects[index % effects.length];
  }, []);

  // Reset idle timer on any user activity
  const resetIdleTimer = useCallback(() => {
    if (isActive) {
      setIsActive(false);
      setIsTransitioning(false);
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    if (photos.length === 0) return;
    timerRef.current = setTimeout(() => {
      setCurrentIndex(Math.floor(Math.random() * photos.length));
      setKenBurnsKey((k) => k + 1);
      setIsActive(true);
    }, idleTimeout);
  }, [isActive, idleTimeout, photos.length]);

  // Set up user activity listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'click', 'scroll'];
    events.forEach((e) => window.addEventListener(e, resetIdleTimer, { passive: true }));
    resetIdleTimer(); // Start the initial timer

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdleTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetIdleTimer]);

  // Auto-advance slides when screensaver is active
  useEffect(() => {
    if (!isActive || photos.length <= 1) return;

    slideTimerRef.current = setInterval(() => {
      setNextIndex((currentIndex + 1) % photos.length);
      setIsTransitioning(true);

      // After crossfade completes, swap current to next
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % photos.length);
        setNextIndex((prev) => (prev + 1) % photos.length);
        setIsTransitioning(false);
        setKenBurnsKey((k) => k + 1);
      }, 1500); // crossfade duration
    }, slideDuration);

    return () => {
      if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    };
  }, [isActive, currentIndex, photos.length, slideDuration]);

  // Preload next image
  useEffect(() => {
    if (!isActive || photos.length <= 1) return;
    const next = (currentIndex + 1) % photos.length;
    const img = new Image();
    img.src = photos[next];
  }, [isActive, currentIndex, photos]);

  if (!isActive || photos.length === 0) return null;

  const currentEffect = getKenBurnsStyle(currentIndex + kenBurnsKey);
  const nextEffect = getKenBurnsStyle(nextIndex + kenBurnsKey + 1);
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <div
      onClick={resetIdleTimer}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#000',
        cursor: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Current photo with Ken Burns */}
      <div
        key={`current-${currentIndex}-${kenBurnsKey}`}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${photos[currentIndex]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          animation: `kenBurns ${slideDuration}ms ease-in-out forwards`,
          opacity: isTransitioning ? 0 : 1,
          transition: 'opacity 1.5s ease-in-out',
        }}
      />

      {/* Next photo (fades in during transition) */}
      {isTransitioning && (
        <div
          key={`next-${nextIndex}-${kenBurnsKey}`}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${photos[nextIndex]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            animation: `kenBurns ${slideDuration}ms ease-in-out forwards`,
            opacity: 1,
            transition: 'opacity 1.5s ease-in-out',
          }}
        />
      )}

      {/* Subtle dark gradient at bottom for time overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '200px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          pointerEvents: 'none',
        }}
      />

      {/* Time overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: '2rem',
          right: '2.5rem',
          color: 'rgba(255,255,255,0.85)',
          fontSize: '2.5rem',
          fontWeight: 300,
          letterSpacing: '-0.02em',
          textShadow: '0 2px 20px rgba(0,0,0,0.5)',
          fontFamily: 'var(--font-inter), sans-serif',
          pointerEvents: 'none',
        }}
      >
        {timeStr}
      </div>

      {/* Tap to dismiss hint (fades out after 3s) */}
      <div
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: '2.5rem',
          color: 'rgba(255,255,255,0.4)',
          fontSize: '0.85rem',
          fontFamily: 'var(--font-inter), sans-serif',
          animation: 'fadeOutHint 4s ease-in-out forwards',
          pointerEvents: 'none',
        }}
      >
        Tap anywhere to return
      </div>

      <style>{`
        @keyframes kenBurns {
          0% { transform: ${currentEffect.from}; }
          100% { transform: ${currentEffect.to}; }
        }
        @keyframes fadeOutHint {
          0% { opacity: 0; }
          15% { opacity: 0.6; }
          70% { opacity: 0.6; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
