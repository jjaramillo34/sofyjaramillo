"use client";

import { IconButton } from "@once-ui-system/core";
import { useEffect, useState } from "react";

/** How far down (px) before the button appears: about one screen. */
const SHOW_AFTER = 600;

/**
 * A round "back to top" button that fades in once the visitor has scrolled
 * about a screen down. Scrolls smoothly unless they prefer reduced motion, then
 * moves keyboard focus to the top of the page so it isn't lost with the button.
 */
export function ScrollToTop({ label }: { label: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setVisible(window.scrollY > SHOW_AFTER));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      cancelAnimationFrame(frame);
    };
  }, []);

  const toTop = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    document.querySelector<HTMLElement>("header a")?.focus({ preventScroll: true });
  };

  return (
    <div className="scroll-top" data-visible={visible} aria-hidden={!visible}>
      <IconButton
        icon="arrowUp"
        variant="primary"
        size="l"
        rounded
        ariaLabel={label}
        tooltip={label}
        tooltipPosition="left"
        onClick={toTop}
        tabIndex={visible ? 0 : -1}
      />
    </div>
  );
}
