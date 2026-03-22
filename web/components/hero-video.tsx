"use client";

import { useEffect, useRef } from "react";

interface HeroVideoProps {
  src?: string;
  posterSrc?: string;
}

export function HeroVideo({ src, posterSrc }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {
      // Autoplay blocked — poster will be shown instead
    });
  }, []);

  const videoSrc = src || "/hero-video.mp4";
  const poster = posterSrc || "/hero-poster.svg";

  return (
    <>
      {src ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={videoSrc}
          poster={poster}
          muted
          loop
          playsInline
          preload="auto"
        />
      ) : (
        // Fallback: gradient background when no video file exists
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${poster})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
    </>
  );
}
