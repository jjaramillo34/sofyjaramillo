"use client";

import { Button, Column, IconButton, Row, Text, useToast, type IconName } from "@once-ui-system/core";
import { useSyncExternalStore } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

type ShareButtonsProps = {
  /** Site-relative path of the page to share, e.g. /es/gallery/jamaica. */
  path: string;
  title: string;
  /** Site-relative image path, sent to Pinterest. */
  image: string;
  t: Dictionary["gallery"]["share"];
};

const noSubscribe = () => () => {};

/**
 * The phone's own share sheet where the browser has one (most phones), plus
 * direct links for the networks people use most, and copy link.
 */
export function ShareButtons({ path, title, image, t }: ShareButtonsProps) {
  const { addToast } = useToast();
  const origin = useSyncExternalStore(noSubscribe, () => window.location.origin, () => "");
  const canNativeShare = useSyncExternalStore(
    noSubscribe,
    () => typeof navigator.share === "function",
    () => false,
  );
  if (!origin) return null;

  const url = `${origin}${path}`;
  const message = t.message.replace("{title}", title);
  const e = encodeURIComponent;

  const networks: { icon: IconName; name: string; href: string }[] = [
    { icon: "whatsapp", name: "WhatsApp", href: `https://wa.me/?text=${e(`${message} ${url}`)}` },
    { icon: "facebook", name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${e(url)}` },
    { icon: "x", name: "X", href: `https://x.com/intent/post?text=${e(message)}&url=${e(url)}` },
    {
      icon: "pinterest",
      name: "Pinterest",
      href: `https://pinterest.com/pin/create/button/?url=${e(url)}&media=${e(origin + image)}&description=${e(message)}`,
    },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      addToast({ variant: "success", message: t.copied });
    } catch {
      window.prompt(t.copy, url);
    }
  };

  return (
    <Column gap="8">
      <Text variant="label-default-s" onBackground="neutral-weak">
        {t.title}
      </Text>
      <Row gap="8" vertical="center" wrap>
        {canNativeShare && (
          <Button
            size="s"
            variant="secondary"
            prefixIcon="share"
            onClick={() => navigator.share({ title, text: message, url }).catch(() => {})}
          >
            {t.native}
          </Button>
        )}
        {networks.map((network) => (
          <IconButton
            key={network.name}
            icon={network.icon}
            variant="secondary"
            size="m"
            href={network.href}
            tooltip={network.name}
            ariaLabel={`${t.on} ${network.name}`}
            target="_blank"
            rel="noopener noreferrer"
          />
        ))}
        <IconButton icon="copy" variant="secondary" size="m" tooltip={t.copy} ariaLabel={t.copy} onClick={copy} />
      </Row>
    </Column>
  );
}
