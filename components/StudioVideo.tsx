"use client";

import { IconButton, Row } from "@once-ui-system/core";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

type StudioVideoProps = {
  src: string;
  poster: string;
  label: string;
  playLabel: string;
  pauseLabel: string;
};

/**
 * A short, silent process clip. The file only loads once the video is near
 * the screen; it then plays on a loop while visible and pauses when scrolled
 * away. Visitors who prefer reduced motion see the poster and start it
 * themselves. The pause button meets WCAG 2.2.2 (moving content over 5s).
 */
export function StudioVideo({ src, poster, label, playLabel, pauseLabel }: StudioVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [playing, setPlaying] = useState(false);
  // Once the visitor pauses, scrolling back into view must not restart it.
  const userPaused = useRef(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const loader = new IntersectionObserver(([entry]) => entry.isIntersecting && setNear(true), {
      rootMargin: "400px 0px",
    });
    const visibility = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !reducedMotion && !userPaused.current) {
          video.play().catch(() => {});
        } else if (!entry.isIntersecting) {
          video.pause();
        }
      },
      { threshold: 0.4 },
    );
    loader.observe(video);
    visibility.observe(video);
    return () => {
      loader.disconnect();
      visibility.disconnect();
    };
  }, [reducedMotion, near]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      userPaused.current = false;
      setNear(true);
      video.play().catch(() => {});
    } else {
      userPaused.current = true;
      video.pause();
    }
  };

  return (
    <Row fillWidth radius="s" overflow="hidden" background="neutral-alpha-weak">
      <video
        ref={videoRef}
        src={near ? src : undefined}
        poster={poster}
        aria-label={label}
        muted
        loop
        playsInline
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        style={{ display: "block", width: "100%", aspectRatio: "384 / 580", objectFit: "cover" }}
      />
      <Row position="absolute" bottom="12" right="12">
        <IconButton
          icon={playing ? "pause" : "play"}
          variant="secondary"
          size="m"
          rounded
          ariaLabel={playing ? pauseLabel : playLabel}
          tooltip={playing ? pauseLabel : playLabel}
          onClick={toggle}
        />
      </Row>
    </Row>
  );
}
