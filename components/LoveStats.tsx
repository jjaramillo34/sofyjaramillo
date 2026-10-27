"use client";

import { Background, Button, Column, CountFx, Grid, Media, Row, Text, useInViewport } from "@once-ui-system/core";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useLikes } from "@/components/Likes";
import { SectionTitle } from "@/components/SectionTitle";
import type { Artwork } from "@/lib/content";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

type LoveStatsProps = {
  lang: Locale;
  artworks: Artwork[];
  t: Dictionary["love"];
};

/**
 * "Loved by visitors": total hearts, how many pieces have hearts, and the most
 * loved piece. Numbers count up when the section scrolls into view, in a
 * shimmering Starry Night gradient, and keep counting live as visitors like
 * pieces elsewhere on the page. Hidden when likes are unavailable (no database).
 */
export function LoveStats({ lang, artworks, t }: LoveStatsProps) {
  const likes = useLikes();
  const ref = useRef<HTMLDivElement>(null);
  const inViewport = useInViewport(ref, { rootMargin: "0px 0px -15% 0px" });
  const [seen, setSeen] = useState(false);
  if (inViewport && !seen) setSeen(true);

  useEffect(() => likes?.load(), [likes]);

  const stats = useMemo(() => {
    const counts = likes?.counts ?? {};
    const total = artworks.reduce((sum, artwork) => sum + (counts[artwork.slug] ?? 0), 0);
    const loved = artworks.filter((artwork) => (counts[artwork.slug] ?? 0) > 0).length;
    const top = artworks.reduce<Artwork | null>(
      (best, artwork) => ((counts[artwork.slug] ?? 0) > (best ? (counts[best.slug] ?? 0) : 0) ? artwork : best),
      null,
    );
    return { total, loved, top, topCount: top ? (counts[top.slug] ?? 0) : 0 };
  }, [artworks, likes?.counts]);

  if (!likes?.ready) return <div ref={ref} />;

  return (
    <Column ref={ref} fillWidth horizontal="center" paddingX="24">
      <Column
        maxWidth="l"
        className="love-panel"
        theme="dark"
        radius="xl"
        border="brand-alpha-medium"
        overflow="hidden"
        paddingX="48"
        paddingY="64"
        gap="48"
        s={{ paddingX: "24", paddingY: "40" }}
      >
        <Background
          position="absolute"
          top="0"
          left="0"
          fill
          pointerEvents="none"
          dots={{ display: true, color: "accent-alpha-medium", size: "24", opacity: 30 }}
          gradient={{
            display: true,
            colorStart: "accent-alpha-weak",
            colorEnd: "static-transparent",
            x: 85,
            y: 10,
            width: 70,
            height: 70,
            opacity: 80,
          }}
        />
        <TwinklingStars />

        <Column zIndex={1} fillWidth horizontal="center">
          <SectionTitle
            align="center"
            icon="heart"
            eyebrow={t.eyebrow}
            title={t.title}
            highlight={t.titleHighlight}
          />
        </Column>

        {stats.total === 0 ? (
          <Column zIndex={1} fillWidth horizontal="center" gap="24" align="center">
            <span className="love-heart-beat" aria-hidden="true">
              ♥
            </span>
            <Text as="p" variant="heading-default-l" onBackground="neutral-strong">
              {t.empty}
            </Text>
            <Button href={`/${lang}/gallery`} prefixIcon="heart" arrowIcon>
              {t.cta}
            </Button>
          </Column>
        ) : (
          <Grid className="love-grid" zIndex={1} fillWidth columns="3" gap="24" m={{ columns: 1 }}>
            <Stat shift={0} value={seen ? stats.total : 0} label={t.total} />
            <Stat
              shift={1}
              value={seen ? stats.loved : 0}
              label={t.pieces}
              detail={t.ofPieces.replace("{total}", String(artworks.length))}
            />
            {stats.top && (
              <Link href={`/${lang}/gallery/${stats.top.slug}`} className="love-top">
                <Row
                  fill
                  gap="16"
                  vertical="center"
                  padding="20"
                  radius="l"
                  border="neutral-alpha-medium"
                  background="neutral-alpha-weak"
                >
                  <Row radius="m" overflow="hidden" border width="80" flex={0}>
                    <Media src={stats.top.image} alt={stats.top.alt} aspectRatio="4 / 5" sizes="80px" />
                  </Row>
                  <Column gap="4" fillWidth>
                    <Text variant="label-default-s" onBackground="accent-medium">
                      {t.mostLoved}
                    </Text>
                    <Text variant="heading-strong-m" onBackground="neutral-strong" truncate>
                      {stats.top.title}
                    </Text>
                    <Row gap="4" vertical="center">
                      <PaintedCount
                        small
                        shift={2}
                        variant="heading-strong-l"
                        value={seen ? stats.topCount : 0}
                        speed={1600}
                      />
                      <Text variant="label-default-s" onBackground="neutral-medium">
                        {t.hearts}
                      </Text>
                    </Row>
                  </Column>
                </Row>
              </Link>
            )}
          </Grid>
        )}
      </Column>
    </Column>
  );
}

function Stat({ value, label, detail, shift }: { value: number; label: string; detail?: string; shift: number }) {
  return (
    <Column
      gap="8"
      padding="24"
      radius="l"
      border="neutral-alpha-medium"
      background="neutral-alpha-weak"
      horizontal="center"
      align="center"
    >
      <PaintedCount shift={shift} variant="display-strong-l" value={value} speed={2000} />
      <Text variant="heading-default-s" onBackground="neutral-strong">
        {label}
      </Text>
      {detail && (
        <Text variant="body-default-s" onBackground="neutral-weak">
          {detail}
        </Text>
      )}
    </Column>
  );
}

type PaintedCountProps = {
  value: number;
  /** Count-up duration in ms. */
  speed: number;
  /** Offsets the gradient so neighbouring numbers show different colours. */
  shift: number;
  variant: "display-strong-l" | "heading-strong-l";
  small?: boolean;
};

/**
 * Counts up in plain white, then a Starry Night gradient sweeps across the
 * digits like a brushstroke and keeps drifting. Two CountFx run in sync: the
 * white base, and the coloured copy on top (hidden from screen readers) that
 * is revealed once the count lands.
 */
function PaintedCount({ value, speed, shift, variant, small }: PaintedCountProps) {
  const [painted, setPainted] = useState(false);

  useEffect(() => {
    if (painted || value === 0) return;
    // With reduced motion CountFx shows the final number at once, so paint it at once too.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setPainted(true), reduced ? 0 : speed + 80);
    return () => window.clearTimeout(timer);
  }, [painted, value, speed]);

  return (
    <span
      className={small ? "painted-count painted-count-small" : "painted-count"}
      data-painted={painted}
      style={{ "--shift": shift } as CSSProperties}
    >
      <CountFx className="painted-base" variant={variant} value={value} speed={speed} separator="," />
      <span className="painted-color" aria-hidden="true">
        <CountFx className="starry-count" variant={variant} value={value} speed={speed} separator="," />
      </span>
    </span>
  );
}

/** A few gold stars that twinkle in the panel's corners. */
function TwinklingStars() {
  const stars = [
    { left: "6%", top: "14%", size: 6, delay: 0 },
    { left: "18%", top: "78%", size: 4, delay: 1.2 },
    { left: "91%", top: "22%", size: 5, delay: 0.6 },
    { left: "82%", top: "84%", size: 7, delay: 2 },
    { left: "48%", top: "6%", size: 4, delay: 1.6 },
  ];
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {stars.map((star, i) => (
        <span
          key={i}
          className="love-star"
          style={{ left: star.left, top: star.top, width: star.size, height: star.size, animationDelay: `${star.delay}s` }}
        />
      ))}
    </div>
  );
}
