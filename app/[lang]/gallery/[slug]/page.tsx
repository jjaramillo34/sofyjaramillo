import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GalleryView } from "@/components/GalleryView";
import { getArtwork, getArtworks } from "@/lib/content";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

/*
 * A single artwork's page: the gallery with that piece open. It exists so that
 * a shared link previews the artwork itself (title, description and the image
 * from opengraph-image.tsx here) instead of the generic site card.
 */

export async function generateStaticParams() {
  return (await getArtworks("en")).map((artwork) => ({ slug: artwork.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/gallery/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return {};
  const artwork = await getArtwork(lang, slug);
  if (!artwork) return {};

  const description = artwork.description || artwork.alt;
  return {
    title: artwork.title,
    description,
    alternates: {
      canonical: `/${lang}/gallery/${slug}`,
      languages: { en: `/en/gallery/${slug}`, es: `/es/gallery/${slug}` },
    },
    openGraph: { title: `${artwork.title} · Sofy Jaramillo`, description, type: "article" },
    twitter: { card: "summary_large_image", title: `${artwork.title} · Sofy Jaramillo`, description },
  };
}

export default async function ArtworkPage({ params }: PageProps<"/[lang]/gallery/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();

  const [dict, artworks] = await Promise.all([getDictionary(lang), getArtworks(lang)]);
  if (!artworks.some((artwork) => artwork.slug === slug)) notFound();

  return <GalleryView lang={lang} dict={dict} artworks={artworks} initialPiece={slug} />;
}
