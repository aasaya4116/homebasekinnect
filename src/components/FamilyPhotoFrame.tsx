'use client';

import { useState, useEffect, useRef } from 'react';

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
      className="widget mem"
      onClick={handleNext}
      title="Tap to see next photo"
    >
      {photos.length > 0 ? (
        <>
          <img
            className="mem-photo"
            src={photos[currentIndex]}
            alt="Family memory"
            style={{ opacity: isTransitioning ? 0 : 1 }}
          />
          {isTransitioning && (
            <img
              className="mem-photo"
              src={photos[nextIndex]}
              alt="Family memory"
              style={{ opacity: 1 }}
            />
          )}
        </>
      ) : (
        <div className="mem-empty">No photos found in Drive</div>
      )}

      <div className="mem-scrim">
        <span className="ovl">Memories</span>
        {photos.length > 0 && (
          <span className="mem-count">
            Photo {currentIndex + 1} of {photos.length}
          </span>
        )}
      </div>
    </div>
  );
}
