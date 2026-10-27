"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Wraps the Starry Night scene: pauses its animations while it is off screen,
 * and feeds the pointer position into --sky-x / --sky-y (−0.5…0.5) so the
 * layers drift for a little depth. Parallax is skipped for touch screens and
 * reduced motion.
 */
export function SkyMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      el.dataset.paused = String(!entry.isIntersecting);
    });
    observer.observe(el);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    let frame = 0;
    const onPointerMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty("--sky-x", (event.clientX / window.innerWidth - 0.5).toFixed(3));
        el.style.setProperty("--sky-y", (event.clientY / window.innerHeight - 0.5).toFixed(3));
      });
    };
    if (!reduceMotion && finePointer) window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className="starry" aria-hidden="true">
      {children}
    </div>
  );
}
