"use client";

import { Column, Heading, Icon, Row, Text, useInViewport, type IconName } from "@once-ui-system/core";
import { useRef, useState, type CSSProperties, type ReactNode } from "react";

const sizes = {
  xl: { title: "display-strong-l", description: "body-default-xl" },
  l: { title: "display-strong-m", description: "body-default-l" },
  m: { title: "display-strong-s", description: "body-default-l" },
  s: { title: "heading-strong-xl", description: "body-default-m" },
} as const;

const WORD_STAGGER_MS = 65;

type SectionTitleProps = {
  title: string;
  /** Part of `title` to underline with a gold brushstroke. Ignored if not found. */
  highlight?: string;
  eyebrow?: string;
  icon?: IconName;
  description?: ReactNode;
  /** Rendered under the description, e.g. buttons. Animates in with it. */
  children?: ReactNode;
  as?: "h1" | "h2" | "h3";
  size?: keyof typeof sizes;
  align?: "start" | "center";
  /** "load" plays on page load (use above the fold); "view" waits until scrolled into view. */
  trigger?: "load" | "view";
  /** Extra delay before the words start, in ms. */
  delay?: number;
  maxWidth?: number;
};

/**
 * The site's heading block: an icon eyebrow pill, a title whose words rise in
 * one by one with a brushstroke drawn under the highlight, then the
 * description. All motion is CSS, keyed off data-st-state, and is skipped
 * under prefers-reduced-motion.
 */
export function SectionTitle({
  title,
  highlight,
  eyebrow,
  icon,
  description,
  children,
  as = "h2",
  size = "m",
  align = "start",
  trigger = "view",
  delay = 0,
  maxWidth,
}: SectionTitleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inViewport = useInViewport(ref);
  const [seen, setSeen] = useState(trigger === "load");
  // Latch: once seen, stay played even after scrolling away.
  if (inViewport && !seen) setSeen(true);

  const words = splitWords(title, highlight);
  const centered = align === "center";
  const afterDelay = delay + words.length * WORD_STAGGER_MS + 250;

  return (
    <Column
      ref={ref}
      gap="16"
      maxWidth={maxWidth}
      horizontal={centered ? "center" : "start"}
      align={centered ? "center" : undefined}
      data-st-state={seen ? "play" : "hidden"}
      style={{ "--base": `${delay}ms` } as CSSProperties}
    >
      {eyebrow && (
        <Row
          className="st-after"
          style={{ "--after": `${delay}ms` } as CSSProperties}
          gap="8"
          vertical="center"
          paddingX="12"
          paddingY="4"
          radius="full"
          border="brand-alpha-medium"
          background="brand-alpha-weak"
        >
          {icon && <Icon name={icon} size="xs" onBackground="accent-medium" />}
          <Text variant="label-default-s" onBackground="brand-strong">
            {eyebrow}
          </Text>
        </Row>
      )}

      <Heading as={as} variant={sizes[size].title} align={centered ? "center" : undefined} aria-label={title}>
        <span aria-hidden="true">
          {words.map((word, i) =>
            word.space ? (
              word.text
            ) : (
              <span
                key={i}
                className={word.highlight ? "st-word st-highlight" : "st-word"}
                style={{ "--i": word.index } as CSSProperties}
              >
                {word.text}
                {word.highlight && (
                  <svg className="st-stroke" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M2 8 C 22 3, 48 10, 70 6 S 92 4, 98 7" pathLength={1} fill="none" />
                  </svg>
                )}
              </span>
            ),
          )}
        </span>
      </Heading>

      {description && (
        <Text
          as="p"
          className="st-after"
          style={{ "--after": `${afterDelay}ms` } as CSSProperties}
          variant={sizes[size].description}
          onBackground="neutral-medium"
          align={centered ? "center" : undefined}
        >
          {description}
        </Text>
      )}

      {children && (
        <Row
          className="st-after"
          style={{ "--after": `${afterDelay + 120}ms` } as CSSProperties}
          paddingTop="8"
          horizontal={centered ? "center" : "start"}
        >
          {children}
        </Row>
      )}
    </Column>
  );
}

type Token = { text: string; space: boolean; highlight: boolean; index: number };

/** Splits a title into words and spaces, flagging the words inside `highlight`. */
function splitWords(title: string, highlight?: string): Token[] {
  const start = highlight ? title.indexOf(highlight) : -1;
  const end = start >= 0 && highlight ? start + highlight.length : -1;

  let offset = 0;
  let wordIndex = 0;
  return title.split(/(\s+)/).flatMap((text) => {
    if (!text) return [];
    const from = offset;
    offset += text.length;
    const space = /^\s+$/.test(text);
    return {
      text,
      space,
      highlight: !space && start >= 0 && from < end && from + text.length > start,
      index: space ? -1 : wordIndex++,
    };
  });
}
