import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cacheLife } from "next/cache";
import sharp from "sharp";
import { getArtwork, getArtworks } from "@/lib/content";
import { defaultLocale, hasLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { Brushstroke, dataUrl, Eyebrow, OG_SIZE, ogAsset, Polaroid, renderOgJpeg, SkyBackdrop } from "@/lib/og";

/*
 * Link preview for one artwork: the piece pinned on the hero's sky with its
 * title, category and medium. Rendered at build time for every artwork in
 * both languages.
 */

export const alt = "An artwork by Sofy Jaramillo";
export const size = OG_SIZE;
export const contentType = "image/jpeg";

/** The polaroid's photo area: the artwork is fitted inside this box. */
const PHOTO_BOX = { width: 340, height: 440 };

export async function generateStaticParams() {
  const slugs = (await getArtworks("en")).map((artwork) => artwork.slug);
  return locales.flatMap((lang) => slugs.map((slug) => ({ lang, slug })));
}

export default async function ArtworkOpenGraphImage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const jpeg = await renderCard(hasLocale(lang) ? lang : defaultLocale, slug);
  if (!jpeg) return new Response("Not found", { status: 404 });
  return new Response(jpeg, { headers: { "Content-Type": contentType } });
}

async function renderCard(lang: Locale, slug: string): Promise<Uint8Array<ArrayBuffer> | null> {
  "use cache";
  cacheLife("max");

  const artwork = await getArtwork(lang, slug);
  if (!artwork) return null;

  const [dict, sky, sunflower, original] = await Promise.all([
    getDictionary(lang),
    ogAsset("og/sky.jpg"),
    ogAsset("brand/sunflower.svg"),
    readFile(join(process.cwd(), "public", artwork.image)),
  ]);

  // Originals can be several MB; shrink to 1.5× the displayed size before embedding.
  const { data: photo, info } = await sharp(original)
    .rotate()
    .resize({ width: PHOTO_BOX.width * 1.5, height: PHOTO_BOX.height * 1.5, fit: "inside" })
    .jpeg({ quality: 80 })
    .toBuffer({ resolveWithObject: true });
  const width = Math.round(info.width / 1.5);
  const height = Math.round(info.height / 1.5);

  const titleSize = artwork.title.length > 28 ? 60 : artwork.title.length > 18 ? 74 : 92;
  const details = [dict.gallery.filters[artwork.category], artwork.medium].filter(Boolean).join("  ·  ");

  return renderOgJpeg(
    <div style={{ display: "flex", width: "100%", height: "100%", position: "relative", fontFamily: "Geist", color: "white" }}>
      <SkyBackdrop sky={sky} />

      <div
        style={{
          position: "absolute",
          left: 72,
          top: 0,
          bottom: 0,
          width: 1200 - 72 - width - 200,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Eyebrow sunflower={sunflower}>Sofy Jaramillo</Eyebrow>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontFamily: "Fraunces",
            fontSize: titleSize,
            lineHeight: 1.05,
            letterSpacing: -1.5,
          }}
        >
          {artwork.title}
        </div>
        <Brushstroke width={340} />
        <div style={{ display: "flex", marginTop: 26, fontSize: 30, lineHeight: 1.35, color: "#ffd24a", fontWeight: 600 }}>
          {details}
        </div>
        <div style={{ display: "flex", marginTop: 18, fontSize: 26, color: "rgba(255,255,255,0.85)" }}>
          {dict.hero.eyebrow}
        </div>
      </div>

      <Polaroid src={dataUrl(photo, "image/jpeg")} width={width} height={height} caption={`${artwork.year}`} />
    </div>,
  );
}
