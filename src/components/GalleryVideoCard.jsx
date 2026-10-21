import React, { useState, useEffect, useRef } from 'react';
import { mediaUrl } from '../lib/urls';

export default function GalleryVideoCard({ item, isActive, loop = true, onEnded }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const stallTimerRef = useRef(null);

  const [isNearViewport, setIsNearViewport] = useState(false);
  const [is60PercentVisible, setIs60PercentVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStalled, setIsStalled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [userToggledPlay, setUserToggledPlay] = useState(false);

  const videoSrc = mediaUrl(item?.videoUrl || item?.video_url || '');
  const posterSrc = mediaUrl(item?.posterUrl || item?.poster_url || item?.imageUrl || '');

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mql.matches);
    const handler = (e) => setReducedMotion(e.matches);
    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
    if (mql.addListener) {
      mql.addListener(handler);
      return () => mql.removeListener(handler);
    }
  }, []);

  // Ensure DOM video element is explicitly muted for mobile autoplay policies
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.defaultMuted = true;
    }
  }, [isNearViewport]);

  // 1. Proximity Observer: Attach <video src> only when ~300px from viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 2. Visibility Observer: Card must be >= 60% visible to play
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIs60PercentVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIs60PercentVisible(entry.intersectionRatio >= 0.6);
        }
      },
      { threshold: [0, 0.6, 1.0] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 3. Playback trigger: play only when >= 60% visible AND active slide
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isNearViewport) return;

    const shouldAutoPlay = !reducedMotion && isActive && is60PercentVisible;
    const shouldPlay = reducedMotion ? userToggledPlay : shouldAutoPlay;

    if (shouldPlay) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          setIsPlaying(false);
        });
      }
    } else {
      video.pause();
      if (!isActive) {
        try { video.currentTime = 0; } catch (e) {}
      }
      setIsPlaying(false);
      setIsStalled(false);
      if (stallTimerRef.current) {
        clearTimeout(stallTimerRef.current);
        stallTimerRef.current = null;
      }
    }
  }, [isActive, is60PercentVisible, isNearViewport, reducedMotion, userToggledPlay]);

  // Stall detection: If video stalls or waits for > 4s, quietly show poster
  const handleWaitingOrStalled = () => {
    if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
    stallTimerRef.current = setTimeout(() => {
      setIsStalled(true);
    }, 4000);
  };

  const handlePlaying = () => {
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
    setIsStalled(false);
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  };

  const handleManualToggle = (e) => {
    if (!reducedMotion) return;
    e.preventDefault();
    e.stopPropagation();
    setUserToggledPlay((prev) => !prev);
  };

  useEffect(() => {
    return () => {
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
    };
  }, []);

  const showPoster = !isPlaying || isStalled;

  return (
    <div
      ref={containerRef}
      className="gallery-video-card-container"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#f7f6f3'
      }}
      onClick={reducedMotion ? handleManualToggle : undefined}
    >
      {/* Video Element: preload="none", src applied when within 300px */}
      <video
        ref={videoRef}
        src={isNearViewport ? videoSrc : undefined}
        muted
        playsInline
        loop={loop}
        preload="none"
        onEnded={() => { if (isActive && onEnded) onEnded(); }}
        onWaiting={handleWaitingOrStalled}
        onStalled={handleWaitingOrStalled}
        onPlaying={handlePlaying}
        onPause={handlePause}
        onError={() => { setIsPlaying(false); if (isActive && onEnded) onEnded(); }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
          display: 'block'
        }}
      />

      {/* Poster Image: immediately visible (CLS = 0), fades only on 'playing' */}
      <img
        src={posterSrc}
        alt={item?.title || 'logcloth gallery reel'}
        loading="lazy"
        decoding="async"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
          display: 'block',
          opacity: showPoster ? 1 : 0,
          pointerEvents: 'none',
          transition: 'opacity 0.28s ease',
          willChange: 'opacity'
        }}
      />

      {/* Prefers-reduced-motion tap-to-play badge */}
      {reducedMotion && showPoster && (
        <div
          className="gallery-video-reduced-motion-badge"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(0, 0, 0, 0.65)',
            color: '#fff',
            fontSize: '11px',
            fontWeight: '600',
            padding: '4px 8px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            zIndex: 3,
            pointerEvents: 'none'
          }}
        >
          ▶ Tap to play
        </div>
      )}
    </div>
  );
}
