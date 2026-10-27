import "@once-ui-system/core/css/styles.css";
import "@once-ui-system/core/css/tokens.css";
import "../globals.css";

import { Column, Row, ThemeInit, VisuallyHidden } from "@once-ui-system/core";
import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Providers } from "@/components/Providers";
import { ScrollToTop } from "@/components/ScrollToTop";
import { getBio } from "@/lib/content";
import { hasLocale, locales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { siteUrl } from "@/lib/site";
import { dataStyle, style } from "@/resources/once-ui.config";
import { Analytics } from "@vercel/analytics/next"

// A soft, expressive serif for headings; Geist keeps body copy and labels crisp.
const heading = Fraunces({ variable: "--font-heading", subsets: ["latin"], display: "swap" });
const body = Geist({ variable: "--font-body", subsets: ["latin"], display: "swap" });
const label = Geist({ variable: "--font-label", subsets: ["latin"], display: "swap" });
const code = Geist_Mono({ variable: "--font-code", subsets: ["latin"], display: "swap" });

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    metadataBase: siteUrl(),
    title: { default: dict.meta.title, template: `%s · Sofy Jaramillo` },
    description: dict.meta.description,
    alternates: {
      canonical: `/${lang}`,
      languages: { en: "/en", es: "/es", "x-default": "/es" },
    },
    // The image itself comes from opengraph-image.tsx next to this layout.
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      siteName: "Sofy Jaramillo",
      locale: lang === "es" ? "es_EC" : "en_US",
      alternateLocale: lang === "es" ? "en_US" : "es_EC",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.title,
      description: dict.meta.description,
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const [dict, bio] = await Promise.all([getDictionary(lang), getBio(lang)]);

  return (
    <Row
      as="html"
      lang={lang}
      suppressHydrationWarning
      className={[heading.variable, body.variable, label.variable, code.variable].join(" ")}
    >
      <head>
        <Analytics />
        {/* Sets data-theme and the color scheme before first paint. */}
        <ThemeInit config={style} dataStyle={dataStyle} />
      </head>
      <Providers>
        <Column as="body" background="page" fillWidth margin="0" padding="0" minHeight="100vh">
          <VisuallyHidden as="a" href="#main" focusable>
            {dict.nav.skipToContent}
          </VisuallyHidden>
          <Header lang={lang} nav={dict.nav} />
          <Column as="main" id="main" fillWidth flex={1} horizontal="center">
            {children}
          </Column>
          <Footer footer={dict.footer} instagram={bio?.instagram ?? null} email={bio?.email ?? ""} />
          <ScrollToTop label={dict.nav.backToTop} />
        </Column>
      </Providers>
    </Row>
  );
}
