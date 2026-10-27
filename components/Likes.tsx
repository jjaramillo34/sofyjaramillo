"use client";

import { Row, Text } from "@once-ui-system/core";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { LikesGetResponse, LikesPostResponse } from "@/app/api/likes/route";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

type LikesState = {
  /** false until loaded, and stays false if likes are unavailable (no database). */
  ready: boolean;
  counts: Record<string, number>;
  liked: Set<string>;
  toggle: (slug: string) => void;
  load: () => void;
};

const LikesContext = createContext<LikesState | null>(null);

/**
 * Holds like counts for the whole page. Pages are prerendered, so counts are
 * fetched in the browser, once, the first time a LikeButton mounts.
 */
export function LikesProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const requested = useRef(false);
  const pending = useRef(new Set<string>());

  const load = useCallback(() => {
    if (requested.current) return;
    requested.current = true;
    fetch("/api/likes")
      .then((res) => res.json() as Promise<LikesGetResponse>)
      .then((data) => {
        if (!data.ok) return;
        setCounts(data.counts);
        setLiked(new Set(data.liked));
        setReady(true);
      })
      .catch(() => {});
  }, []);

  const toggle = useCallback(
    (slug: string) => {
      if (pending.current.has(slug)) return;
      const next = !liked.has(slug);
      const previousCount = counts[slug] ?? 0;

      // Optimistic: update now, reconcile with the server's answer, revert on failure.
      pending.current.add(slug);
      setLiked((set) => toggled(set, slug, next));
      setCounts((c) => ({ ...c, [slug]: Math.max(0, previousCount + (next ? 1 : -1)) }));

      fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, liked: next }),
      })
        .then((res) => res.json() as Promise<LikesPostResponse>)
        .then((data) => {
          if (!data.ok) throw new Error(data.error);
          setCounts((c) => ({ ...c, [slug]: data.count }));
          setLiked((set) => toggled(set, slug, data.liked));
        })
        .catch(() => {
          setCounts((c) => ({ ...c, [slug]: previousCount }));
          setLiked((set) => toggled(set, slug, !next));
        })
        .finally(() => pending.current.delete(slug));
    },
    [counts, liked],
  );

  return <LikesContext.Provider value={{ ready, counts, liked, toggle, load }}>{children}</LikesContext.Provider>;
}

/** Like counts for the page; null outside a LikesProvider. Call load() to fetch them. */
export const useLikes = () => useContext(LikesContext);

function toggled(set: Set<string>, slug: string, on: boolean) {
  const next = new Set(set);
  if (on) next.add(slug);
  else next.delete(slug);
  return next;
}

type LikeButtonProps = {
  slug: string;
  title: string;
  t: Dictionary["gallery"]["likes"];
  /** "overlay" floats on a thumbnail; "inline" sits in the artwork details. */
  variant?: "overlay" | "inline";
};

export function LikeButton({ slug, title, t, variant = "overlay" }: LikeButtonProps) {
  const likes = useContext(LikesContext);
  const [burst, setBurst] = useState(0);

  useEffect(() => likes?.load(), [likes]);
  if (!likes?.ready) return null;

  const isLiked = likes.liked.has(slug);
  const count = likes.counts[slug] ?? 0;
  const countLabel = count === 1 ? t.one : t.count.replace("{count}", String(count));

  return (
    <button
      type="button"
      className={`like-button like-${variant}`}
      aria-pressed={isLiked}
      aria-label={`${isLiked ? t.unlike : t.like} ${title} (${countLabel})`}
      onClick={() => {
        if (!isLiked) setBurst((n) => n + 1);
        likes.toggle(slug);
      }}
    >
      <Row gap="8" vertical="center">
        <span key={burst} className={burst ? "like-heart like-pop" : "like-heart"} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="1em" height="1em">
            <path
              d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
              fill={isLiked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <Text as="span" variant="label-strong-s" aria-hidden="true">
          {count}
        </Text>
      </Row>
    </button>
  );
}
