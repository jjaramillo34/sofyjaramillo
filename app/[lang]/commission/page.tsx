import { Background, Column, Skeleton } from "@once-ui-system/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CommissionForm } from "@/components/CommissionForm";
import { SectionTitle } from "@/components/SectionTitle";
import { getArtworks } from "@/lib/content";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/commission">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.commission.title,
    description: dict.commission.intro,
    alternates: {
      canonical: `/${lang}/commission`,
      languages: { en: "/en/commission", es: "/es/commission" },
    },
  };
}

export default async function CommissionPage({ params }: PageProps<"/[lang]/commission">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const [dict, artworks] = await Promise.all([getDictionary(lang), getArtworks(lang)]);
  const artworkTitles = Object.fromEntries(artworks.map((artwork) => [artwork.slug, artwork.title]));

  return (
    <Column fillWidth horizontal="center" paddingX="24" paddingY="80" s={{ paddingX: "16", paddingY: "40" }}>
      <Background
        position="absolute"
        top="0"
        left="0"
        fill
        pointerEvents="none"
        gradient={{
          display: true,
          colorStart: "brand-alpha-weak",
          colorEnd: "static-transparent",
          x: 50,
          y: 0,
          width: 120,
          height: 60,
          opacity: 70,
        }}
      />
      <Column zIndex={1} maxWidth="m" gap="40">
        <SectionTitle
          as="h1"
          size="l"
          trigger="load"
          icon="paintbrush"
          eyebrow={dict.commission.eyebrow}
          title={dict.commission.title}
          highlight={dict.commission.titleHighlight}
          description={dict.commission.intro}
        />
        {/* The form pre-fills from ?type and ?ref (the "Inquire" link in the gallery). */}
        <Suspense fallback={<Skeleton shape="block" style={{ height: "48rem", width: "100%" }} />}>
          <CommissionForm lang={lang} t={dict.commission} artworkTitles={artworkTitles} />
        </Suspense>
      </Column>
    </Column>
  );
}
