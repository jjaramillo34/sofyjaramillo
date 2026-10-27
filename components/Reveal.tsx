"use client";

import { RevealFx, useInViewport } from "@once-ui-system/core";
import { useRef, useState, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Stagger siblings with `delay={index * 90}` (ms). */
  delay?: number;
  /** Stretch to the parent's height, so cards in a grid row stay equal. */
  fillHeight?: boolean;
};

/**
 * Fades and lifts its content in the first time it scrolls into view.
 * For secondary content (cards, grids, form sections), not page headlines:
 * RevealFx blurs content until it plays.
 */
export function Reveal({ children, delay = 0, fillHeight }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inViewport = useInViewport(ref, { rootMargin: "0px 0px -10% 0px" });
  const [seen, setSeen] = useState(false);
  if (inViewport && !seen) setSeen(true);

  return (
    <div ref={ref} style={fillHeight ? { height: "100%" } : undefined}>
      {/* RevealFx is a row flex by default, which shrinks children to their content;
          a column lets them stretch to the full width like they would without the wrapper. */}
      <RevealFx
        revealed={seen}
        delay={delay}
        translateY="16"
        speed="fast"
        direction="column"
        fillWidth={!fillHeight}
        fill={fillHeight}
      >
        {children}
      </RevealFx>
    </div>
  );
}
