import { Column, Icon, Media, Row, Text } from "@once-ui-system/core";
import type { Artwork } from "@/lib/content";

type ArtworkThumbProps = {
  artwork: Artwork;
  categoryLabel: string;
  priority?: boolean;
};

/** Image + caption for a single piece. Interactivity is supplied by the wrapper. */
export function ArtworkThumb({ artwork, categoryLabel, priority }: ArtworkThumbProps) {
  return (
    <Column gap="12" fillWidth>
      <Row fillWidth radius="l" overflow="hidden" border>
        <Media
          src={artwork.image}
          alt={artwork.alt}
          aspectRatio="4 / 5"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized={artwork.image.endsWith(".svg")}
          priority={priority}
        />
        {artwork.video && (
          <Row
            position="absolute"
            bottom="12"
            right="12"
            center
            width="40"
            height="40"
            radius="full"
            background="overlay"
            border
          >
            <Icon name="play" size="s" onBackground="neutral-strong" />
          </Row>
        )}
      </Row>
      <Column gap="4" paddingX="4">
        <Text variant="heading-strong-s" onBackground="neutral-strong">
          {artwork.title}
        </Text>
        <Text variant="body-default-xs" onBackground="neutral-weak">
          {categoryLabel} · {artwork.year}
        </Text>
      </Column>
    </Column>
  );
}
