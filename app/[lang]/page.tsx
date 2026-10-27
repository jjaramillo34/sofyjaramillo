import { Background, Button, Card, Column, Flex, Grid, Icon, Media, Row, Text } from "@once-ui-system/core";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtworkThumb } from "@/components/ArtworkThumb";
import { LikeButton } from "@/components/Likes";
import { LoveStats } from "@/components/LoveStats";
import { Reveal } from "@/components/Reveal";
import { SectionTitle } from "@/components/SectionTitle";
import { StarryNight } from "@/components/StarryNight";
import { StudioVideo } from "@/components/StudioVideo";
import { artworkCategories } from "@/keystatic.config";
import { getArtworks, getBio } from "@/lib/content";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

const mediumIcons = {
  paintings: "palette",
  drawings: "penTool",
  wearables: "shirt",
} as const;

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const [dict, artworks, bio] = await Promise.all([getDictionary(lang), getArtworks(lang), getBio(lang)]);
  const featured = artworks.filter((artwork) => artwork.featured).slice(0, 3);
  const leadArtwork = featured[0] ?? artworks[0];
  // Her own Starry Night, which the hero's lanterns come from.
  const starryNight = artworks.find((artwork) => artwork.slug === "la-noche-estrellada-mi-interpretacion");
  // The painting-in-progress clip for the "Behind the brush" section.
  const studioPiece = artworks.find((artwork) => artwork.slug === "emily-denim-jacket" && artwork.video);
  const bioParagraphs = (bio?.text || dict.hero.intro).split(/\n\s*\n/).filter(Boolean);

  return (
    <Column fillWidth horizontal="center" gap="104" paddingBottom="104">
      {/* Hero: a living Starry Night. Always dark, whatever the site theme, since it's a night sky. */}
      <Column
        fillWidth
        center
        theme="dark"
        paddingTop="104"
        paddingBottom="160"
        paddingX="24"
        style={{ minHeight: "min(94svh, 980px)" }}
        s={{ paddingTop: "64", paddingBottom: "128" }}
      >
        <StarryNight />
        <div className="starry-scrim" />
        <Column className="hero-copy" zIndex={1} fillWidth horizontal="center">
          <SectionTitle
            as="h1"
            size="xl"
            align="center"
            trigger="load"
            maxWidth={48}
            icon="mapPin"
            eyebrow={dict.hero.eyebrow}
            title={dict.hero.title}
            highlight={dict.hero.titleHighlight}
            description={dict.hero.intro}
          >
            <Row gap="12" s={{ direction: "column", fillWidth: true }}>
              <Button href={`/${lang}/gallery`} size="l" prefixIcon="gallery" arrowIcon>
                {dict.hero.ctaGallery}
              </Button>
              <Button href={`/${lang}/commission`} size="l" variant="secondary" prefixIcon="paintbrush">
                {dict.hero.ctaCommission}
              </Button>
            </Row>
          </SectionTitle>
        </Column>
        {starryNight && (
          <Row position="absolute" bottom="24" right="24" zIndex={1} s={{ hide: true }}>
            <Button
              href={`/${lang}/gallery?piece=${starryNight.slug}`}
              variant="tertiary"
              size="s"
              prefixIcon="moonStar"
              suffixIcon="arrowRight"
            >
              {dict.hero.skyCaption}
            </Button>
          </Row>
        )}
      </Column>

      {/* Bio */}
      <Column fillWidth horizontal="center" paddingX="24">
        <Grid maxWidth="l" columns="2" gap="64" s={{ columns: 1, gap: "32" }} style={{ alignItems: "center" }}>
          <Reveal>
            <Row radius="xl" overflow="hidden" border shadow="l">
              {bio?.portrait ? (
                <Media src={bio.portrait} alt={bio.portraitAlt} aspectRatio="4 / 5" sizes="(max-width: 768px) 100vw, 50vw" />
              ) : (
                // No portrait yet: show her lead piece instead.
                leadArtwork && (
                  <Media
                    src={leadArtwork.image}
                    alt={leadArtwork.alt}
                    aspectRatio="4 / 5"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                )
              )}
            </Row>
          </Reveal>
          <Column gap="20">
            <SectionTitle
              icon="palette"
              eyebrow={dict.bio.eyebrow}
              title={dict.bio.title}
              highlight={dict.bio.titleHighlight}
            />
            {bioParagraphs.map((paragraph, index) => (
              <Reveal key={index} delay={300 + index * 120}>
                <Text as="p" variant="body-default-l" onBackground="neutral-medium">
                  {paragraph}
                </Text>
              </Reveal>
            ))}
          </Column>
        </Grid>
      </Column>

      {/* Mediums */}
      <Column fillWidth horizontal="center" paddingX="24">
        <Column maxWidth="l" gap="40">
          <SectionTitle
            maxWidth={32}
            icon="brush"
            eyebrow={dict.mediums.eyebrow}
            title={dict.mediums.title}
            highlight={dict.mediums.titleHighlight}
          />
          <Grid columns="3" gap="24" m={{ columns: 1 }}>
            {artworkCategories.map((category, index) => (
              <Reveal key={category} delay={index * 110} fillHeight>
                <Card
                  className="lift"
                  href={`/${lang}/gallery?category=${category}`}
                  fillHeight
                  direction="column"
                  gap="16"
                  padding="24"
                  radius="l"
                  border
                  background="surface"
                >
                  <Row
                    className="wiggle"
                    center
                    width="48"
                    height="48"
                    radius="m"
                    background="accent-alpha-weak"
                    border="accent-alpha-medium"
                  >
                    <Icon name={mediumIcons[category]} size="m" onBackground="accent-medium" />
                  </Row>
                  <Text as="h3" variant="heading-strong-m" onBackground="neutral-strong">
                    {dict.mediums[category].title}
                  </Text>
                  <Text variant="body-default-s" onBackground="neutral-weak">
                    {dict.mediums[category].description}
                  </Text>
                  <Row gap="4" vertical="center" textVariant="label-strong-s" onBackground="brand-medium">
                    {dict.mediums.explore}
                    <Icon name="arrowRight" size="xs" onBackground="brand-medium" />
                  </Row>
                </Card>
              </Reveal>
            ))}
          </Grid>
        </Column>
      </Column>

      {/* Featured */}
      {featured.length > 0 && (
        <Column fillWidth horizontal="center" paddingX="24">
          <Column maxWidth="l" gap="40">
            <Row horizontal="between" vertical="end" gap="16" s={{ direction: "column", vertical: "start" }}>
              <SectionTitle
                icon="sparkles"
                eyebrow={dict.featured.eyebrow}
                title={dict.featured.title}
                highlight={dict.featured.titleHighlight}
              />
              <Button href={`/${lang}/gallery`} variant="tertiary" prefixIcon="gallery" arrowIcon>
                {dict.featured.viewAll}
              </Button>
            </Row>
            <Grid as="ul" columns="3" gap="32" m={{ columns: 2 }} s={{ columns: 1 }} margin="0" padding="0">
              {featured.map((artwork, index) => (
                <li key={artwork.slug} style={{ listStyle: "none" }}>
                  <Reveal delay={index * 110}>
                    <div className="art-card">
                      <Link
                        href={`/${lang}/gallery/${artwork.slug}`}
                        className="art-trigger"
                        aria-label={`${dict.gallery.details.open} ${artwork.title}`}
                      >
                        <ArtworkThumb artwork={artwork} categoryLabel={dict.gallery.filters[artwork.category]} />
                      </Link>
                      <LikeButton slug={artwork.slug} title={artwork.title} t={dict.gallery.likes} />
                    </div>
                  </Reveal>
                </li>
              ))}
            </Grid>
          </Column>
        </Column>
      )}

      {/* Loved by visitors: animated like counts (client-side, needs the database) */}
      <LoveStats lang={lang} artworks={artworks} t={dict.love} />

      {/* Behind the brush: the jacket painting video */}
      {studioPiece?.video && (
        <Column fillWidth horizontal="center" paddingX="24">
          {/* Flex rather than Grid: a 2:3 split on desktop that stacks on phones. */}
          <Flex maxWidth="l" gap="64" vertical="center" s={{ direction: "column", gap: "40" }}>
            <Row flex={2} horizontal="center">
              <Reveal>
                <Column className="polaroid" background="surface" border shadow="xl" padding="12" paddingBottom="16" gap="12" radius="s">
                  <span className="polaroid-tape" aria-hidden="true" />
                  <StudioVideo
                    src={studioPiece.video}
                    poster={studioPiece.image}
                    label={dict.studio.videoLabel}
                    playLabel={dict.studio.play}
                    pauseLabel={dict.studio.pause}
                  />
                  <Text variant="label-default-s" onBackground="neutral-medium" align="center">
                    {studioPiece.title}
                  </Text>
                </Column>
              </Reveal>
            </Row>
            <Column flex={3} gap="24">
              <SectionTitle
                icon="shirt"
                eyebrow={dict.studio.eyebrow}
                title={dict.studio.title}
                highlight={dict.studio.titleHighlight}
                description={dict.studio.body}
              />
              <Reveal delay={250}>
                <Column as="figure" gap="8" margin="0" paddingLeft="20" borderLeft="accent-alpha-strong" borderWidth={2}>
                  <Text as="blockquote" variant="heading-default-m" onBackground="neutral-strong" margin="0" style={{ fontStyle: "italic" }}>
                    “{dict.studio.quote}”
                  </Text>
                  <Text as="figcaption" variant="label-default-s" onBackground="neutral-weak">
                    — {dict.studio.quoteBy}
                  </Text>
                </Column>
              </Reveal>
              <Reveal delay={400}>
                <Row>
                  <Button
                    href={`/${lang}/commission?type=clothing&ref=${studioPiece.slug}`}
                    size="l"
                    prefixIcon="paintbrush"
                    arrowIcon
                  >
                    {dict.studio.button}
                  </Button>
                </Row>
              </Reveal>
            </Column>
          </Flex>
        </Column>
      )}

      {/* Commission CTA */}
      <Column fillWidth horizontal="center" paddingX="24">
        <Column
          maxWidth="l"
          radius="xl"
          border="brand-alpha-medium"
          paddingX="48"
          paddingY="64"
          horizontal="center"
          overflow="hidden"
          s={{ paddingX: "24", paddingY: "40" }}
        >
          <Background
            position="absolute"
            top="0"
            left="0"
            fill
            pointerEvents="none"
            gradient={{
              display: true,
              colorStart: "accent-alpha-medium",
              colorEnd: "static-transparent",
              x: 50,
              y: 100,
              width: 140,
              height: 100,
              opacity: 70,
            }}
          />
          <Column zIndex={1} fillWidth horizontal="center">
            <SectionTitle
              align="center"
              maxWidth={36}
              icon="messageHeart"
              eyebrow={dict.nav.commission}
              title={dict.commissionCta.title}
              highlight={dict.commissionCta.titleHighlight}
              description={dict.commissionCta.body}
            >
              <Button href={`/${lang}/commission`} size="l" prefixIcon="wand">
                {dict.commissionCta.button}
              </Button>
            </SectionTitle>
          </Column>
        </Column>
      </Column>
    </Column>
  );
}
