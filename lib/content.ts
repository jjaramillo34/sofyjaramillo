import "server-only";
import { createReader } from "@keystatic/core/reader";
import { cacheLife, cacheTag } from "next/cache";
import keystaticConfig from "@/keystatic.config";
import type { ArtworkCategory } from "@/lib/artwork-categories";
import type { Locale } from "@/lib/i18n/config";

const reader = createReader(process.cwd(), keystaticConfig);

/** An artwork resolved to one locale: the shape the UI renders. */
export type Artwork = {
  slug: string;
  title: string;
  category: ArtworkCategory;
  image: string;
  video: string | null;
  alt: string;
  medium: string;
  dimensions: string;
  year: number;
  description: string;
  featured: boolean;
};

export type Bio = {
  portrait: string | null;
  portraitAlt: string;
  text: string;
  instagram: string | null;
  email: string;
};

// Content is prerendered and cached until a Keystatic save invalidates these tags
// (see app/api/keystatic/[...params]/route.ts). A short cacheLife would make every
// page using it dynamic: Next.js excludes caches expiring in under 5 minutes from prerendering.
const contentCacheLife = () => cacheLife("max");
export const contentTags = ["artworks", "bio"] as const;

export async function getArtworks(locale: Locale): Promise<Artwork[]> {
  "use cache";
  contentCacheLife();
  cacheTag(contentTags[0]);

  const entries = await reader.collections.artworks.all();
  const es = locale === "es";

  return entries
    .sort(
      (a, b) =>
        (a.entry.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.entry.sortOrder ?? Number.MAX_SAFE_INTEGER) ||
        b.entry.year - a.entry.year,
    )
    .map(({ slug, entry }) => {
      const title = es ? entry.title_es || entry.title_en : entry.title_en;
      return {
        slug,
        title,
        category: entry.category,
        // The reader returns bare filenames; files live under publicPath/<slug>/.
        image: `/images/artworks/${slug}/${entry.image}`,
        video: entry.video ? `/images/artworks/${slug}/${entry.video}` : null,
        alt: (es ? entry.alt_es : entry.alt_en) || title,
        medium: (es ? entry.medium_es : entry.medium_en) || "",
        dimensions: entry.dimensions,
        year: entry.year,
        description: (es ? entry.description_es : entry.description_en) || "",
        featured: entry.featured,
      };
    });
}

export async function getArtwork(locale: Locale, slug: string): Promise<Artwork | undefined> {
  return (await getArtworks(locale)).find((artwork) => artwork.slug === slug);
}

export async function getBio(locale: Locale): Promise<Bio | null> {
  "use cache";
  contentCacheLife();
  cacheTag(contentTags[1]);

  const bio = await reader.singletons.bio.read();
  if (!bio) return null;
  const es = locale === "es";
  return {
    portrait: bio.portrait ? `/images/bio/${bio.portrait}` : null,
    portraitAlt: (es ? bio.portraitAlt_es : bio.portraitAlt_en) || "Sofy",
    text: (es ? bio.bio_es : bio.bio_en) || "",
    instagram: bio.instagram,
    email: bio.email,
  };
}
