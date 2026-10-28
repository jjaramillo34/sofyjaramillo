import { Background, Button, Column, Grid, Icon, Row, Skeleton, Text } from "@once-ui-system/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CommissionForm } from "@/components/CommissionForm";
import { SectionTitle } from "@/components/SectionTitle";
import { getArtworks } from "@/lib/content";
import { hasLocale } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { commissionsOpen } from "@/lib/site";

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
  const open = commissionsOpen();

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
        {open ? (
          <>
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
          </>
        ) : (
          <ComingSoon lang={lang} t={dict.commission} />
        )}
      </Column>
    </Column>
  );
}

const comingTypes = [
  { type: "canvas", icon: "palette" },
  { type: "drawing", icon: "penTool" },
  { type: "sneakers", icon: "footprints" },
  { type: "clothing", icon: "shirt" },
] as const;

/** Shown instead of the form until COMMISSIONS_OPEN=true. */
function ComingSoon({ lang, t }: { lang: Locale; t: Dictionary["commission"] }) {
  return (
    <>
      <SectionTitle
        as="h1"
        size="l"
        trigger="load"
        icon="calendarHeart"
        eyebrow={t.eyebrow}
        title={t.soon.title}
        highlight={t.soon.titleHighlight}
        description={t.soon.body}
      >
        <Row gap="12" s={{ direction: "column", fillWidth: true }}>
          <Button href={`/${lang}/gallery`} size="l" prefixIcon="gallery" arrowIcon>
            {t.soon.gallery}
          </Button>
          <Button href={`/${lang}`} size="l" variant="secondary" prefixIcon="home">
            {t.soon.home}
          </Button>
        </Row>
      </SectionTitle>

      <Column className="anim-rise" gap="16" style={{ "--delay": "500ms" } as React.CSSProperties}>
        <Text as="h2" variant="label-strong-m" onBackground="neutral-medium">
          {t.soon.whatsComing}
        </Text>
        <Grid columns="4" gap="12" m={{ columns: 2 }}>
          {comingTypes.map(({ type, icon }) => (
            <Column
              key={type}
              gap="12"
              padding="20"
              radius="l"
              border
              background="surface"
              horizontal="center"
              align="center"
            >
              <Row center width="48" height="48" radius="m" background="accent-alpha-weak" border="accent-alpha-medium">
                <Icon name={icon} size="m" onBackground="accent-medium" />
              </Row>
              <Text variant="label-default-m" onBackground="neutral-strong">
                {t.projectTypes[type]}
              </Text>
            </Column>
          ))}
        </Grid>
      </Column>
    </>
  );
}
