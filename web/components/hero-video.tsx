"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface HeroVideoProps {
  src?: string;
  posterSrc?: string;
}

export function HeroVideo({ src, posterSrc }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);

  const videoSrc = src || "/hero-video.mp4";
  const poster = posterSrc || "/hero-poster.svg";

  const handleError = useCallback(() => setVideoFailed(true), []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || videoFailed) return;

    video.play().catch(() => {
      /* autoplay blocked — poster shown via poster attr */
    });
  }, [videoFailed]);

  return (
    <>
      {!videoFailed ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={videoSrc}
          poster={poster}
          muted
          loop
          playsInline
          preload="auto"
          onError={handleError}
        />
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${poster})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
    </>
  );
}
