"use client";

import { Button, Column, Drawer, Icon, IconButton, Line, Row, Text, ToggleButton } from "@once-ui-system/core";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LOCALE_COOKIE, locales, switchLocalePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

/** Once UI's Drawer slide-out time (EXIT_MS in its source). */
const DRAWER_EXIT_MS = 320;

type HeaderProps = {
  lang: Locale;
  nav: Dictionary["nav"];
};

export function Header({ lang, nav }: HeaderProps) {
  const pathname = usePathname() ?? `/${lang}`;
  const router = useRouter();
  // The phone menu is open only on the page it was opened on, so following a
  // link (or switching language) closes it without an effect.
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;

  const links = [
    { href: `/${lang}`, label: nav.home, icon: "home", exact: true },
    { href: `/${lang}/gallery`, label: nav.gallery, icon: "gallery", exact: false },
    { href: `/${lang}/commission`, label: nav.commission, icon: "paintbrush", exact: false },
  ] as const;

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Row
      as="header"
      className="anim-fade-down"
      position="sticky"
      top="0"
      zIndex={9}
      fillWidth
      horizontal="center"
      paddingX="24"
      paddingY="12"
      background="page"
      borderBottom
      s={{ paddingX: "16", paddingY: "8" }}
    >
      <Row maxWidth="l" vertical="center" horizontal="between" gap="16">
        <Link href={`/${lang}`} aria-label="Sofy Jaramillo — home" style={{ textDecoration: "none" }}>
          <Row vertical="center" gap="8">
            <SunflowerMark />
            <Text variant="heading-strong-m" onBackground="neutral-strong">
              Sofy Jaramillo
            </Text>
          </Row>
        </Link>

        {/* Tablet and desktop: links and language inline */}
        <Row vertical="center" gap="16" s={{ hide: true }}>
          <Row as="nav" aria-label={nav.menu} gap="4">
            {links.map((link) => {
              const active = isActive(link.href, link.exact);
              return (
                <ToggleButton
                  key={link.href}
                  href={link.href}
                  selected={active}
                  aria-current={active ? "page" : undefined}
                  size="s"
                  prefixIcon={link.icon}
                  label={link.label}
                />
              );
            })}
          </Row>
          <LanguageSwitch lang={lang} pathname={pathname} label={nav.language} />
        </Row>

        {/* Phones: a menu button that opens the drawer */}
        <Row hide s={{ hide: false }}>
          <IconButton
            icon="menu"
            variant="secondary"
            size="l"
            ariaLabel={nav.openMenu}
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            onClick={() => setMenuPath(pathname)}
          />
        </Row>
      </Row>

      <Drawer open={menuOpen} onClose={() => setMenuPath(null)} side="right" size="s" title={nav.menu}>
        <Column fillWidth gap="24" paddingTop="8">
          <Column as="nav" aria-label={nav.menu} gap="4">
            {links.map((link) => {
              const active = isActive(link.href, link.exact);
              return (
                <ToggleButton
                  key={link.href}
                  href={link.href}
                  selected={active}
                  aria-current={active ? "page" : undefined}
                  size="l"
                  fillWidth
                  horizontal="start"
                  prefixIcon={link.icon}
                  label={link.label}
                />
              );
            })}
          </Column>
          <Line />
          <Column gap="8">
            <Text variant="label-default-s" onBackground="neutral-weak">
              {nav.language}
            </Text>
            {/* Switching language swaps the root layout, which would strand the open
                drawer's panel in the new page: close it, then switch once it's gone. */}
            <LanguageSwitch
              lang={lang}
              pathname={pathname}
              label={nav.language}
              onSwitch={(href) => {
                setMenuPath(null);
                window.setTimeout(() => router.push(href), DRAWER_EXIT_MS);
              }}
            />
          </Column>
          <Button href={`/${lang}/commission`} prefixIcon="wand" fillWidth size="l">
            {nav.cta}
          </Button>
        </Column>
      </Drawer>
    </Row>
  );
}

type LanguageSwitchProps = {
  lang: Locale;
  pathname: string;
  label: string;
  /** Takes over navigation when set (the link's default is prevented). */
  onSwitch?: (href: string) => void;
};

function LanguageSwitch({ lang, pathname, label, onSwitch }: LanguageSwitchProps) {
  return (
    <Row role="group" aria-label={label} gap="2" padding="2" radius="full" border background="surface" vertical="center">
      <Row paddingLeft="8" paddingRight="4" aria-hidden="true">
        <Icon name="languages" size="xs" onBackground="neutral-weak" />
      </Row>
      {locales.map((locale) => (
        <ToggleButton
          key={locale}
          href={switchLocalePath(pathname, locale)}
          onClick={(event) => {
            rememberLocale(locale);
            if (!onSwitch) return;
            event.preventDefault();
            onSwitch(switchLocalePath(pathname, locale));
          }}
          selected={locale === lang}
          aria-current={locale === lang ? "true" : undefined}
          lang={locale}
          aria-label={locale === "en" ? "English" : "Español"}
          size="s"
          rounded
          label={locale.toUpperCase()}
        />
      ))}
    </Row>
  );
}

// Remember an explicit choice so the root redirect honors it next visit.
function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

/** A tiny sunflower: gold petals around a deep-blue center. */
function SunflowerMark() {
  const petals = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg width="28" height="28" viewBox="-16 -16 32 32" aria-hidden="true">
      {petals.map((angle) => (
        <ellipse
          key={angle}
          cx="0"
          cy="-9"
          rx="3"
          ry="6"
          fill="var(--accent-solid-strong)"
          transform={`rotate(${angle})`}
        />
      ))}
      <circle r="6" fill="var(--brand-solid-strong)" />
      <circle r="3" fill="var(--brand-solid-medium)" opacity="0.6" />
    </svg>
  );
}
