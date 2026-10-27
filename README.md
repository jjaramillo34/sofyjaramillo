# Sofy Jaramillo — Portfolio & Commissions

Bilingual (EN/ES) portfolio and custom-art commission site for Sofia Yaneli Jaramillo Bustos.
Next.js 16 (App Router, Cache Components) · Once UI · Keystatic · MongoDB Atlas · Resend · Vercel Blob.

## Getting started

```bash
cp .env.example .env.local   # fill in MONGODB_URI at minimum
npm install
npm run dev
```

- Site: http://localhost:3000 (redirects to `/es` or `/en` from the browser language or the last language picked)
- CMS: http://localhost:3000/keystatic, for adding or editing artworks and the biography

## Structure

```
app/
  [lang]/                    # every public page is localized: /en/…, /es/…
    layout.tsx               # root layout: Once UI providers, fonts, header/footer
    page.tsx                 # home: hero, bio, mediums, featured, commission CTA
    gallery/page.tsx         # filterable gallery + lightbox (?category=…&piece=…)
    commission/page.tsx      # commission form (?type=…&ref=… pre-fills it)
    not-found.tsx, [...rest] # localized 404
  keystatic/                 # CMS admin UI (separate root layout)
  api/keystatic/[...params]  # CMS API
  api/commissions/route.ts   # POST: validate → Blob upload → MongoDB → notify
components/
  SectionTitle.tsx           # reusable animated heading: icon eyebrow, rising words, brushstroke highlight
  Reveal.tsx                 # scroll-triggered entrance (Once UI RevealFx), stagger with delay
  StarryNight.tsx, SkyMotion.tsx  # the animated Van Gogh hero (SVG scene + parallax/pause)
  StudioVideo.tsx            # lazy, muted, in-view looping clip with a pause button
  Header, Footer, GalleryGrid, ArtworkThumb, CommissionForm
resources/icons.tsx          # Lucide icons registered in Once UI (use names like "palette" in <Icon>/prefixIcon)
content/                     # Keystatic data (YAML), committed to git
  artworks/*.yaml
  bio.yaml
lib/
  i18n/                      # locales, dictionaries (en.ts is the source of truth for keys)
  validation/commission.ts   # one zod schema for client and server, messages per locale
  models/CommissionRequest.ts
  db/mongodb.ts              # cached Mongoose connection
  content.ts                 # Keystatic reader, cached with "use cache"
  notify.ts                  # Resend email + generic webhook
keystatic.config.ts          # artworks collection + bio singleton
proxy.ts                     # locale redirect (Next 16's replacement for middleware.ts)
resources/once-ui.config.ts  # theme: blue brand, yellow accent, sand neutrals
```

## Content

`content/artworks/` holds Sofy's real pieces. Their **years are placeholders (2026) and
dimensions are empty**; mediums and descriptions were written from the photos. Confirm or
correct them in Keystatic. The biography in `content/bio.yaml` is still placeholder copy.

- Images are stored at `public/images/artworks/<slug>/image.<ext>`, and an optional
  process/detail clip at `video.mp4`. Pieces with a video show a play badge and play it in
  the lightbox, with the image as its cover.
- Keep videos short and under ~10 MB; files in `public/` are served from Vercel's CDN.
- `media-originals/` (git-ignored, not served) keeps unedited source media, such as the
  uncropped Facebook story recording of the Emily jacket.
- Fill in the screen-reader descriptions (alt text) in both languages.
- `featured` shows a piece on the home page (first 3); `sortOrder` controls gallery order.

## Commission requests

Stored in the `commission_requests` collection with `status: pending | reviewed | completed`.
Review them in MongoDB Atlas (Data Explorer) and update `status` there. Notifications go to
`COMMISSION_NOTIFY_EMAIL` via Resend and/or `COMMISSION_WEBHOOK_URL`, and are sent after the
response so the visitor isn't kept waiting.

Reference images are uploaded to Vercel Blob as public files with unguessable URLs. The limit is
3 images and 4 MB total, because Vercel Functions accept request bodies up to 4.5 MB.

## Deploying to Vercel

1. Push to GitHub and import the repo in Vercel.
2. Add env vars from `.env.example`, and connect a Blob store (Storage tab).
3. In MongoDB Atlas, allow Vercel's egress under Network Access (`0.0.0.0/0`, or use the Atlas Vercel integration).
4. For editing content on the live site, follow [docs/keystatic-github-setup.md](docs/keystatic-github-setup.md).

## Notes

- `next.config.ts` limits the Tailwind Turbopack loader to the project's own non-module CSS.
  Running it over `node_modules/**/*.module.css` strips Once UI's scoped class names, which
  makes buttons and other components render unstyled.
- Tailwind is loaded without its preflight reset, so Once UI's base styles stay in charge.

## Titles, motion and icons

```tsx
<SectionTitle
  as="h2"                       // h1 for page titles
  size="m"                      // xl (hero) · l (page) · m (section) · s
  trigger="view"                // "load" above the fold, "view" waits for scroll
  icon="palette"                // any registered icon name
  eyebrow="About the artist"
  title="From the Andes, with a Van Gogh heart"
  highlight="Van Gogh"          // words that get the gold brushstroke
  description="Optional paragraph"
>
  <Button>Optional actions</Button>
</SectionTitle>

<Reveal delay={index * 110}>…</Reveal>   // cards, grids, form sections
```

To add an icon, import it from `lucide-react` in `resources/icons.tsx` and add it to the
`icons` map; the name is then type-checked everywhere. All motion is disabled for visitors
with "reduce motion" turned on.

## Icons and link previews

- `app/favicon.ico` (16/32/48 px), `app/icon.svg`, `app/apple-icon.png` and `public/icons/*`
  are rendered from the sunflower in `assets/brand/sunflower.svg` / `sunflower-tile.svg`.
  `app/manifest.ts` describes the installable app.
- `app/[lang]/opengraph-image.tsx` builds the share card for each language at build time
  (1200×630 JPEG). It uses `assets/og/sky.jpg` (a still of the hero), `assets/og/starry-night-painting.jpg`
  (a 900 px copy of her painting) and the fonts in `assets/fonts/`. If the painting photo is
  replaced, refresh that copy, e.g. `sips -Z 900 -s format jpeg <photo> --out assets/og/starry-night-painting.jpg`.
- Preview and canonical links use https://www.sofyjaramillo.com (`lib/site.ts`). Locally,
  `NEXT_PUBLIC_SITE_URL=http://localhost:3000` in `.env.local` points them at the dev server.

## Likes and sharing

- Visitors like pieces anonymously: `POST /api/likes { slug, liked }`, `GET /api/likes` for all counts
  plus what this visitor liked. Stored in MongoDB `artwork_likes`, one document per like, with a
  unique index on (visitor, artwork).
- A visitor is a random id in the httpOnly `sofy_vid` cookie. To stop cookie-clearing spam, each
  network (salted IP hash, `LIKES_SALT`) can add at most 15 likes per artwork. Without
  `MONGODB_URI` the like buttons simply don't appear.
- Each piece has its own page, `/[lang]/gallery/[slug]`: the gallery with that piece open, with its
  own title, description and preview image (`app/[lang]/gallery/[slug]/opengraph-image.tsx`).
  The share buttons (native share sheet, WhatsApp, Facebook, X, Pinterest, copy link) link there.
- Brand icons come from `simple-icons` and are registered in `resources/icons.tsx`.
