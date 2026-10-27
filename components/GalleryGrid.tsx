"use client";

import {
  Button,
  Column,
  Dialog,
  Grid,
  Icon,
  Media,
  Row,
  SegmentedControl,
  Tag,
  Text,
} from "@once-ui-system/core";
import Link from "next/link";
import type { IconName } from "@once-ui-system/core";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { artworkCategories, type ArtworkCategory } from "@/lib/artwork-categories";
import { ArtworkThumb } from "@/components/ArtworkThumb";
import { LikeButton } from "@/components/Likes";
import { Reveal } from "@/components/Reveal";
import { ShareButtons } from "@/components/ShareButtons";
import type { Artwork } from "@/lib/content";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { ProjectType } from "@/lib/validation/commission";

type Filter = "all" | ArtworkCategory;

const filterIcons = {
  all: "sparkles",
  paintings: "palette",
  drawings: "penTool",
  wearables: "shirt",
} as const;

/** Gallery category -> the commission form's closest project type. */
const categoryToProjectType: Record<ArtworkCategory, ProjectType> = {
  paintings: "canvas",
  drawings: "drawing",
  wearables: "sneakers",
};

type GalleryGridProps = {
  artworks: Artwork[];
  lang: Locale;
  t: Dictionary["gallery"];
  /** Opens this piece on load: the per-artwork page /[lang]/gallery/[slug]. */
  initialPiece?: string;
};

/**
 * Filterable grid with a lightbox. The active filter and open piece live in the
 * URL (?category=…&piece=…), so filtered views can be shared. Each piece also has
 * its own page, /[lang]/gallery/[slug], which is what the share buttons link to
 * so link previews show that artwork.
 */
export function GalleryGrid({ artworks, lang, t, initialPiece }: GalleryGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Always /[lang]/gallery, also on a piece's own page, so closing it lands on the gallery.
  const galleryPath = `/${lang}/gallery`;

  const categoryParam = searchParams.get("category");
  const filter: Filter = (artworkCategories as readonly string[]).includes(categoryParam ?? "")
    ? (categoryParam as ArtworkCategory)
    : "all";
  const openSlug = searchParams.get("piece") ?? initialPiece;
  const openArtwork = artworks.find((artwork) => artwork.slug === openSlug);
  // Dialog portals into document.body, which doesn't exist on the server, so a
  // shared ?piece= link opens the lightbox right after hydration instead.
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const hrefWith = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null) next.delete(key);
        else next.set(key, value);
      }
      const query = next.toString();
      return query ? `${galleryPath}?${query}` : galleryPath;
    },
    [galleryPath, searchParams],
  );
  const updateParams = (changes: Record<string, string | null>) =>
    router.replace(hrefWith(changes), { scroll: false });

  const visible = useMemo(
    () => (filter === "all" ? artworks : artworks.filter((artwork) => artwork.category === filter)),
    [artworks, filter],
  );

  const filterOptions: Filter[] = ["all", ...artworkCategories];

  return (
    <Column fillWidth gap="32">
      {/* overflowX lets the filter scroll on phones instead of widening the page. */}
      <Row fillWidth horizontal="center" overflowX="auto">
        <SegmentedControl
          aria-label={t.filters.label}
          fillWidth={false}
          value={filter}
          onChange={(value) => updateParams({ category: value === "all" ? null : value })}
          buttons={filterOptions.map((option) => ({
            value: option,
            prefixIcon: filterIcons[option],
            label: `${t.filters[option]} (${
              option === "all" ? artworks.length : artworks.filter((a) => a.category === option).length
            })`,
          }))}
        />
      </Row>

      <Text as="p" variant="body-default-s" onBackground="neutral-weak" align="center" aria-live="polite">
        {visible.length === 0 ? t.empty : ""}
      </Text>

      <Grid as="ul" columns="3" gap="32" m={{ columns: 2 }} s={{ columns: 1 }} margin="0" padding="0">
        {visible.map((artwork, index) => (
          <li key={artwork.slug} style={{ listStyle: "none" }}>
            {/* Stagger by column so each row ripples in left to right. */}
            <Reveal delay={(index % 3) * 110}>
              <div className="art-card">
                <Link
                  href={hrefWith({ piece: artwork.slug })}
                  replace
                  scroll={false}
                  className="art-trigger"
                  aria-haspopup="dialog"
                  aria-label={`${t.details.open} ${artwork.title}`}
                >
                  <ArtworkThumb
                    artwork={artwork}
                    categoryLabel={t.filters[artwork.category]}
                    priority={index < 3}
                  />
                </Link>
                <LikeButton slug={artwork.slug} title={artwork.title} t={t.likes} />
              </div>
            </Reveal>
          </li>
        ))}
      </Grid>

      <Dialog
        open={hydrated && Boolean(openArtwork)}
        onClose={() => updateParams({ piece: null })}
        title={openArtwork?.title ?? ""}
        maxWidth={64}
      >
        {openArtwork && <ArtworkDetails artwork={openArtwork} lang={lang} t={t} />}
      </Dialog>
    </Column>
  );
}

function ArtworkDetails({ artwork, lang, t }: { artwork: Artwork; lang: Locale; t: Dictionary["gallery"] }) {
  const inquireHref = `/${lang}/commission?${new URLSearchParams({
    type: categoryToProjectType[artwork.category],
    ref: artwork.slug,
  })}`;

  const facts = [
    { icon: "palette", label: t.details.medium, value: artwork.medium },
    { icon: "ruler", label: t.details.dimensions, value: artwork.dimensions },
    { icon: "calendar", label: t.details.year, value: String(artwork.year) },
  ] as const satisfies { icon: IconName; label: string; value: string }[];

  return (
    <Row fillWidth gap="32" s={{ direction: "column", gap: "24" }}>
      <Row flex={3} radius="l" overflow="hidden" border background="neutral-alpha-weak">
        {artwork.video ? (
          <video
            src={artwork.video}
            poster={artwork.image}
            aria-label={artwork.alt}
            controls
            playsInline
            muted
            loop
            preload="metadata"
            style={{ width: "100%", aspectRatio: "4 / 5", objectFit: "contain", display: "block" }}
          />
        ) : (
          <Media
            src={artwork.image}
            alt={artwork.alt}
            aspectRatio="4 / 5"
            objectFit="contain"
            sizes="(max-width: 768px) 100vw, 640px"
            unoptimized={artwork.image.endsWith(".svg")}
            priority
          />
        )}
      </Row>
      <Column flex={2} gap="20">
        <Row horizontal="between" vertical="center" gap="12">
          <Tag scheme="brand" size="s" label={t.filters[artwork.category]} />
          <LikeButton slug={artwork.slug} title={artwork.title} t={t.likes} variant="inline" />
        </Row>
        <Column as="dl" gap="12" margin="0">
          {facts.filter((fact) => fact.value).map((fact) => (
            <Column key={fact.label} gap="2">
              <Row as="dt" gap="4" vertical="center" textVariant="label-default-xs" onBackground="neutral-weak">
                <Icon name={fact.icon} size="xs" onBackground="accent-medium" />
                {fact.label}
              </Row>
              <Text as="dd" variant="body-default-m" onBackground="neutral-strong" margin="0">
                {fact.value}
              </Text>
            </Column>
          ))}
        </Column>
        {artwork.description && (
          <Text as="p" variant="body-default-m" onBackground="neutral-medium" style={{ whiteSpace: "pre-line" }}>
            {artwork.description}
          </Text>
        )}
        <Button href={inquireHref} prefixIcon="wand" fillWidth>
          {t.details.inquire}
        </Button>
        <ShareButtons path={`/${lang}/gallery/${artwork.slug}`} title={artwork.title} image={artwork.image} t={t.share} />
      </Column>
    </Row>
  );
}
