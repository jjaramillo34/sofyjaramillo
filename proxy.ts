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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasPrefix = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasPrefix) return;

  request.nextUrl.pathname = `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Skip API routes, the Keystatic admin, Next internals and files with an extension.
  matcher: ["/((?!api|keystatic|_next|.*\\..*).*)"],
};
