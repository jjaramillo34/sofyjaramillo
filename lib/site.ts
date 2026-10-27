/** The live site's address. */
export const PRODUCTION_URL = "https://www.sofyjaramillo.com";

/**
 * Absolute base for canonical, hreflang and Open Graph image URLs.
 * NEXT_PUBLIC_SITE_URL overrides it (set it to http://localhost:3000 in
 * .env.local); otherwise links always point at the real domain, including on
 * Vercel preview deployments, so shared links and search engines use it.
 */
export function siteUrl(): URL {
  return new URL(process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_URL);
}
