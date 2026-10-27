import { Column, Grid, Skeleton } from "@once-ui-system/core";
import { Suspense } from "react";
import { GalleryGrid } from "@/components/GalleryGrid";
import { SectionTitle } from "@/components/SectionTitle";
import type { Artwork } from "@/lib/content";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

type GalleryViewProps = {
  lang: Locale;
  dict: Dictionary;
  artworks: Artwork[];
  /** Set on a piece's own page: the gallery opens with that piece showing. */
  initialPiece?: string;
};

/** The gallery page body, shared by /[lang]/gallery and /[lang]/gallery/[slug]. */
export function GalleryView({ lang, dict, artworks, initialPiece }: GalleryViewProps) {
  return (
    <Column fillWidth horizontal="center" paddingX="24" paddingY="80" s={{ paddingY: "40" }}>
      <Column maxWidth="l" gap="48">
        <Column fillWidth horizontal="center">
          <SectionTitle
            as="h1"
            size="l"
            align="center"
            trigger="load"
            icon="gallery"
            eyebrow={dict.gallery.eyebrow}
            title={dict.gallery.title}
            highlight={dict.gallery.titleHighlight}
            description={dict.gallery.intro}
          />
        </Column>
        {/* The grid reads ?category and ?piece from the URL, so it renders at request time. */}
        <Suspense fallback={<GallerySkeleton />}>
          <GalleryGrid artworks={artworks} lang={lang} t={dict.gallery} initialPiece={initialPiece} />
        </Suspense>
      </Column>
    </Column>
  );
}

function GallerySkeleton() {
  return (
    <Grid columns="3" gap="32" m={{ columns: 2 }} s={{ columns: 1 }} paddingTop="72">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} shape="block" style={{ aspectRatio: "4 / 5", width: "100%" }} delay={i * 100} />
      ))}
    </Grid>
  );
}
