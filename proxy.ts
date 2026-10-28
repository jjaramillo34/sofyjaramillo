import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale, LOCALE_COOKIE, locales, type Locale } from "@/lib/i18n/config";

/**
 * Countries where Spanish is the main language (ISO 3166-1 alpha-2): Ecuador,
 * the rest of Spanish-speaking Latin America, Puerto Rico and Spain.
 */
const SPANISH_SPEAKING_COUNTRIES = new Set([
  "EC", "AR", "BO", "CL", "CO", "CR", "CU", "DO", "SV", "GT", "HN",
  "MX", "NI", "PA", "PY", "PE", "PR", "UY", "VE", "ES", "GQ",
]);

/**
 * Language for a visitor who opened a URL without /en or /es:
 * 1. the one they picked on the site before (cookie);
 * 2. Spanish when visiting from a Spanish-speaking country (Vercel adds the
 *    visitor's country as the x-vercel-ip-country header; absent locally);
 * 3. their browser's language;
 * 4. Spanish.
 */
function preferredLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie && hasLocale(cookie)) return cookie;

  const country = request.headers.get("x-vercel-ip-country")?.toUpperCase();
  if (country && SPANISH_SPEAKING_COUNTRIES.has(country)) return "es";

  // Accept-Language, e.g. "es-EC,es;q=0.9,en;q=0.8": highest q wins.
  const ranked = (request.headers.get("accept-language") ?? "")
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  return ranked.find((entry) => hasLocale(entry.lang))?.lang as Locale | undefined ?? defaultLocale;
}

/**
 * Forgiving first path segments, so typed or half-typed addresses land on a
 * real page instead of the 404: language typos and capitals ("/e", "/ES",
 * "/español") pick that language ("" = the visitor's preferred one), and page
 * names people might type in Spanish map to the real routes.
 */
const LOCALE_ALIASES: Record<string, Locale | ""> = {
  e: "",
  esp: "es",
  espanol: "es",
  "español": "es",
  spanish: "es",
  eng: "en",
  english: "en",
  ingles: "en",
  "inglés": "en",
};
const PAGE_ALIASES: Record<string, string> = {
  inicio: "",
  home: "",
  galeria: "gallery",
  "galería": "gallery",
  obras: "gallery",
  pedidos: "commission",
  pedido: "commission",
  encargos: "commission",
  commissions: "commission",
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasPrefix = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasPrefix) return;

  const [first = "", ...rest] = pathname.slice(1).split("/");
  const key = decodeURIComponent(first).toLowerCase();

  // "/ES/gallery", "/e", "/español" → that language, keeping the rest of the path.
  const typedLocale = hasLocale(key) ? key : LOCALE_ALIASES[key];
  if (typedLocale !== undefined) {
    const locale = typedLocale || preferredLocale(request);
    request.nextUrl.pathname = ["", locale, ...rest].join("/").replace(/\/$/, "");
    return NextResponse.redirect(request.nextUrl);
  }

  // "/galeria" → "/es/gallery" (or "/en/gallery" for English visitors).
  const page = PAGE_ALIASES[key];
  const tail = page === undefined ? pathname : ["", page, ...rest].join("/").replace(/\/$/, "");
  request.nextUrl.pathname = `/${preferredLocale(request)}${tail === "/" ? "" : tail}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Skip API routes, the Keystatic admin, Next internals and files with an extension.
  matcher: ["/((?!api|keystatic|_next|.*\\..*).*)"],
};
