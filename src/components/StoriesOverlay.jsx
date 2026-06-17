import React, { useState, useEffect, useRef } from 'react';
import { mediaUrl } from '../lib/urls';

export default function StoriesOverlay({ isOpen, onClose, stories, onShopNow }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failedMedia, setFailedMedia] = useState({});
  const timerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setActiveIndex(0);
      setProgress(0);
      setIsPaused(false);
      setFailedMedia({});
    } else {
      document.body.style.overflow = '';
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !stories || stories.length === 0) return;

    if (timerRef.current) clearInterval(timerRef.current);

    const currentStory = stories[activeIndex];
    
    if (currentStory.mediaType === 'video') {
      if (videoRef.current) {
        if (isPaused) {
          videoRef.current.pause();
        } else {
          videoRef.current.play().catch(() => {});
        }
      }
      return;
    }

    if (isPaused) return;

    // For images, progress advances over 5 seconds
    const intervalTime = 50; // Update every 50ms
    const totalTime = 5000;  // 5s duration
    const step = (intervalTime / totalTime) * 100;

    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timerRef.current);
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeIndex, isOpen, stories, isPaused]);

  if (!isOpen || !stories || stories.length === 0) return null;

  const handleNext = () => {
    setProgress(0);
    setActiveIndex(prev => {
      if (prev < stories.length - 1) {
        return prev + 1;
      } else {
        setTimeout(onClose, 0);
        return 0;
      }
    });
  };

  const handlePrev = () => {
    setProgress(0);
    setActiveIndex(prev => {
      if (prev > 0) {
        return prev - 1;
      }
      return 0;
    });
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current && !isPaused) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration || 1;
      setProgress((current / duration) * 100);
    }
  };

  const handleVideoEnded = () => {
    handleNext();
  };

  const currentStory = stories[activeIndex];
  const primaryMediaUrl = currentStory.mediaUrl || currentStory.image || '';
  const fallbackMediaUrl = currentStory.fallbackMediaUrl || '';
  const shouldUseFallback = failedMedia[currentStory.id] && fallbackMediaUrl && fallbackMediaUrl !== primaryMediaUrl;
  const currentMediaUrl = mediaUrl(shouldUseFallback ? fallbackMediaUrl : primaryMediaUrl);
  const hasMediaError = failedMedia[currentStory.id] && !shouldUseFallback;

  const handleMediaError = () => {
    setFailedMedia(prev => ({ ...prev, [currentStory.id]: true }));
  };

  return (
    <div className="story-overlay" onClick={onClose}>
      {/* Top Actions: Pause & Close - positioned outside story image, top-right corner */}
      <div className="story-top-actions" onClick={(e) => e.stopPropagation()}>
        <button 
          className="story-top-action-btn pause-btn" 
          onClick={() => setIsPaused(prev => !prev)}
          title={isPaused ? "Resume" : "Pause"}
        >
          {isPaused ? (
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="4" x2="18" y2="20"></line>
              <line x1="6" y1="4" x2="6" y2="20"></line>
            </svg>
          )}
        </button>
        <button className="story-top-action-btn close-btn" onClick={onClose} title="Close">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="story-player" onClick={(e) => e.stopPropagation()}>
        {/* Top Progress Indicators */}
        <div className="story-progress-indicators">
          {stories.map((s, idx) => {
            let width = '0%';
            if (idx < activeIndex) width = '100%';
            if (idx === activeIndex) width = `${progress}%`;
            
            return (
              <div className="story-progress-bar-bg" key={s.id}>
                <div className="story-progress-bar-fill" style={{ width }} />
              </div>
            );
          })}
        </div>

        {/* Navigation Arrows */}
        <button className="story-arrow story-arrow-left" onClick={handlePrev} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button className="story-arrow story-arrow-right" onClick={handleNext} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        {/* Story Content Area */}
        <div className="story-media-container">
          {currentStory.mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={currentMediaUrl}
              autoPlay
              muted
              playsInline
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleVideoEnded}
              onError={handleMediaError}
              className="story-media-element"
            />
          ) : hasMediaError ? (
            <div className="story-media-error">
              <span>Story media unavailable</span>
            </div>
          ) : (
            <img 
              src={currentMediaUrl} 
              alt={currentStory.caption || 'Story'} 
              className="story-media-element"
              onError={handleMediaError}
            />
          )}

          {currentStory.caption && (
            <div className="story-caption">{currentStory.caption}</div>
          )}

          {/* Shop Now Overlay */}
          {currentStory.shopNowEnabled && currentStory.productId && (
            <div className="story-shop-btn-container">
              <button 
                className="story-shop-now-btn"
                onClick={() => {
                  onClose();
                  onShopNow(currentStory.productId);
                }}
              >
                Shop Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
