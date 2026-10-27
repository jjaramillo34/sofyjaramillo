import { cacheLife } from "next/cache";
import { getArtwork } from "@/lib/content";
import { defaultLocale, hasLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { Brushstroke, dataUrl, Eyebrow, OG_SIZE, ogAsset, Polaroid, renderOgJpeg, SkyBackdrop } from "@/lib/og";

/*
 * The link preview for every page under /en and /es (pages can override it
 * with their own opengraph-image). It is the hero's sky with Sofy's own Starry
 * Night pinned on it (a downsized copy lives in assets/og). Shared card pieces
 * are in lib/og.tsx. Both languages are rendered once, at build time.
 */

export const alt = "Sofy Jaramillo — paintings, drawings and wearable art from Ecuador, inspired by Van Gogh";
export const size = OG_SIZE;
export const contentType = "image/jpeg";

const FEATURED_SLUG = "la-noche-estrellada-mi-interpretacion";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function OpenGraphImage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const jpeg = await renderCard(hasLocale(lang) ? lang : defaultLocale);
  return new Response(jpeg, { headers: { "Content-Type": contentType } });
}

async function renderCard(lang: Locale): Promise<Uint8Array<ArrayBuffer>> {
  "use cache";
  cacheLife("max");

  const [dict, painting, sky, paintingFile, sunflower] = await Promise.all([
    getDictionary(lang),
    getArtwork(lang, FEATURED_SLUG),
    ogAsset("og/sky.jpg"),
    ogAsset("og/starry-night-painting.jpg"),
    ogAsset("brand/sunflower.svg"),
  ]);

  const mediums = [dict.gallery.filters.paintings, dict.gallery.filters.drawings, dict.gallery.filters.wearables];

  return renderOgJpeg(
    <div style={{ display: "flex", width: "100%", height: "100%", position: "relative", fontFamily: "Geist", color: "white" }}>
      <SkyBackdrop sky={sky} />

      <div
        style={{
          position: "absolute",
          left: 72,
          top: 0,
          bottom: 0,
          width: 640,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Eyebrow sunflower={sunflower}>{dict.hero.eyebrow}</Eyebrow>
        <div style={{ display: "flex", marginTop: 28, fontFamily: "Fraunces", fontSize: 104, lineHeight: 1, letterSpacing: -2 }}>
          Sofy Jaramillo
        </div>
        <Brushstroke />
        <div style={{ display: "flex", marginTop: 26, fontSize: 36, lineHeight: 1.3, color: "rgba(255,255,255,0.92)" }}>
          {dict.hero.title}
        </div>
        <div style={{ display: "flex", marginTop: 30, fontSize: 24, fontWeight: 600, color: "#ffd24a", letterSpacing: 0.5 }}>
          {mediums.join("  ·  ")}
        </div>
      </div>

      <Polaroid
        src={dataUrl(paintingFile, "image/jpeg")}
        width={306}
        height={456}
        caption={painting?.title ?? "Sofy Jaramillo"}
      />
    </div>,
  );
}
