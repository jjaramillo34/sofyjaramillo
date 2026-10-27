import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GalleryView } from "@/components/GalleryView";
import { getArtworks } from "@/lib/content";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/gallery">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.gallery.eyebrow,
    description: dict.gallery.intro,
    alternates: { canonical: `/${lang}/gallery`, languages: { en: "/en/gallery", es: "/es/gallery" } },
  };
}

export default async function GalleryPage({ params }: PageProps<"/[lang]/gallery">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const [dict, artworks] = await Promise.all([getDictionary(lang), getArtworks(lang)]);
  return <GalleryView lang={lang} dict={dict} artworks={artworks} />;
}
