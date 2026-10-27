/* eslint-disable @next/next/no-img-element -- these elements are rendered by Satori into a PNG, not by a browser. */
import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { ReactElement } from "react";
import sharp from "sharp";

/*
 * Shared pieces of the link-preview cards (app/[lang]/opengraph-image.tsx and
 * app/[lang]/gallery/[slug]/opengraph-image.tsx). Assets live in /assets: a
 * still of the hero sky, the sunflower mark and the fonts (Satori needs TTF/WOFF).
 */

export const OG_SIZE = { width: 1200, height: 630 };

export const ogAsset = (path: string) => readFile(join(process.cwd(), "assets", path));
export const dataUrl = (data: Buffer, type: string) => `data:${type};base64,${data.toString("base64")}`;

/**
 * Renders a card and re-encodes it as JPEG: ImageResponse only makes PNGs,
 * which come out over 1 MB for a painterly sky, and WhatsApp and others drop
 * previews that large (the JPEG is ~150 kB).
 */
export async function renderOgJpeg(card: ReactElement): Promise<Uint8Array<ArrayBuffer>> {
  const [fraunces, geist, geistSemiBold] = await Promise.all([
    ogAsset("fonts/Fraunces-Bold.woff"),
    ogAsset("fonts/Geist-Regular.woff"),
    ogAsset("fonts/Geist-SemiBold.woff"),
  ]);
  const png = await new ImageResponse(card, {
    ...OG_SIZE,
    fonts: [
      { name: "Fraunces", data: fraunces, weight: 700, style: "normal" },
      { name: "Geist", data: geist, weight: 400, style: "normal" },
      { name: "Geist", data: geistSemiBold, weight: 600, style: "normal" },
    ],
  }).arrayBuffer();
  return new Uint8Array(await sharp(Buffer.from(png)).jpeg({ quality: 82, mozjpeg: true }).toBuffer());
}

/** The hero's starry sky, darkened on the left where the text goes. */
export function SkyBackdrop({ sky }: { sky: Buffer }) {
  return (
    <>
      <img src={dataUrl(sky, "image/jpeg")} width={1200} height={630} alt="" style={{ position: "absolute", inset: 0 }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "linear-gradient(90deg, rgba(4,9,30,0.92) 0%, rgba(4,9,30,0.72) 46%, rgba(4,9,30,0.15) 72%, rgba(4,9,30,0) 100%)",
        }}
      />
    </>
  );
}

/** A small pill with the sunflower mark, like the site's section eyebrows. */
export function Eyebrow({ sunflower, children }: { sunflower: Buffer; children: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 12,
        padding: "8px 20px 8px 10px",
        borderRadius: 999,
        border: "2px solid rgba(255,210,74,0.45)",
        background: "rgba(255,210,74,0.12)",
        fontSize: 24,
        fontWeight: 600,
      }}
    >
      <img src={dataUrl(sunflower, "image/svg+xml")} width={32} height={32} alt="" />
      {children}
    </div>
  );
}

/** Gold brushstroke under a title, like the site's SectionTitle. */
export function Brushstroke({ width = 460 }: { width?: number }) {
  return (
    <svg width={width} height="28" viewBox="0 0 460 28" preserveAspectRatio="none" style={{ marginTop: 6 }}>
      <path d="M6 18 C 90 6, 200 24, 300 14 S 420 8, 454 16" stroke="#ffd24a" strokeWidth="10" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** An image pinned on the right like a taped polaroid, with a caption. */
export function Polaroid({ src, width, height, caption }: { src: string; width: number; height: number; caption: string }) {
  return (
    <div
      style={{
        position: "absolute",
        right: 84,
        top: (630 - height - 80) / 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "14px 14px 0",
        background: "#fbf7ee",
        borderRadius: 6,
        transform: "rotate(4deg)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -16,
          left: width / 2 - 36,
          width: 100,
          height: 30,
          background: "rgba(255,210,74,0.75)",
          transform: "rotate(-4deg)",
          display: "flex",
        }}
      />
      <img src={src} width={width} height={height} alt="" style={{ borderRadius: 2 }} />
      <div
        style={{
          display: "flex",
          maxWidth: width,
          padding: "12px 0 16px",
          fontFamily: "Fraunces",
          fontSize: 20,
          color: "#2a2420",
        }}
      >
        {caption}
      </div>
    </div>
  );
}
