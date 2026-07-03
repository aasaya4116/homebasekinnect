'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';

interface FamilyPhotoFrameProps {
  photos: string[];
  intervalMs?: number;
}

export default function FamilyPhotoFrame({
  photos,
  intervalMs = 10000,
}: FamilyPhotoFrameProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (photos.length <= 1) return;

    timerRef.current = setInterval(() => {
      setNextIndex((currentIndex + 1) % photos.length);
      setIsTransitioning(true);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % photos.length);
        setNextIndex((prev) => (prev + 1) % photos.length);
        setIsTransitioning(false);
      }, 1000); // 1s fade duration
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, photos.length, intervalMs]);

  const handleNext = () => {
    if (photos.length <= 1 || isTransitioning) return;
    setNextIndex((currentIndex + 1) % photos.length);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
      setNextIndex((prev) => (prev + 1) % photos.length);
      setIsTransitioning(false);
    }, 1000);
  };

  return (
    <div
      className="widget"
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '0.75rem',
        cursor: photos.length > 1 ? 'pointer' : 'default',
        position: 'relative',
      }}
      onClick={handleNext}
      title="Tap to see next photo"
    >
      <div className="widget-header" style={{ marginBottom: '0.4rem', flexShrink: 0 }}>
        <div className="widget-title" style={{ fontSize: '0.75rem' }}>
          <Camera size={14} color="var(--accent-orange)" />
          Memories
        </div>
        {photos.length > 0 && (
          <span
            className="widget-badge"
            style={{
              background: 'var(--accent-orange-glow)',
              color: 'var(--accent-orange)',
              fontSize: '0.65rem',
              padding: '2px 6px',
            }}
          >
            {currentIndex + 1}/{photos.length}
          </span>
        )}
      </div>

      <div
        style={{
          flex: 1,
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          minHeight: 0,
          background: 'var(--bg-panel-hover)',
          border: '1px solid var(--border-color)',
        }}
      >
        {photos.length > 0 ? (
          <>
            <img
              src={photos[currentIndex]}
              alt="Family Memory"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                opacity: isTransitioning ? 0 : 1,
                transition: 'opacity 1s ease-in-out',
              }}
            />
            {isTransitioning && (
              <img
                src={photos[nextIndex]}
                alt="Family Memory"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  opacity: 1,
                  transition: 'opacity 1s ease-in-out',
                }}
              />
            )}
          </>
        ) : (
          <div className="empty-state" style={{ height: '100%', fontSize: '0.8rem' }}>
            No photos found in Drive
          </div>
        )}
      </div>
    </div>
  );
}
