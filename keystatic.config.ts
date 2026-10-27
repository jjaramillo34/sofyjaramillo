import { collection, config, fields, singleton } from "@keystatic/core";

export { artworkCategories, type ArtworkCategory } from "@/lib/artwork-categories";

// Local mode edits files on disk (great for `npm run dev`). Set
// NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO=owner/repo to edit through GitHub in production.
const githubRepo = process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO as `${string}/${string}` | undefined;

export default config({
  storage: githubRepo ? { kind: "github", repo: githubRepo } : { kind: "local" },
  ui: {
    brand: { name: "Sofy Jaramillo · Studio" },
    navigation: {
      Portfolio: ["artworks"],
      Pages: ["bio"],
    },
  },
  collections: {
    artworks: collection({
      label: "Artworks / Obras",
      slugField: "title_en",
      path: "content/artworks/*",
      format: { data: "yaml" },
      columns: ["title_en", "category", "year"],
      entryLayout: "form",
      schema: {
        title_en: fields.slug({
          name: { label: "Title (English)", validation: { isRequired: true } },
          slug: { label: "URL slug", description: "Used in links. Lowercase, dashes only." },
        }),
        title_es: fields.text({
          label: "Título (Español)",
          validation: { isRequired: true },
        }),
        category: fields.select({
          label: "Category / Categoría",
          options: [
            { label: "Canvas & Paper Paintings / Óleos y Lienzos", value: "paintings" },
            { label: "Sketches & Drawings / Dibujos e Ilustraciones", value: "drawings" },
            { label: "Custom Wearable Art / Ropa y Calzado", value: "wearables" },
          ],
          defaultValue: "paintings",
        }),
        image: fields.image({
          label: "Image / Imagen",
          description: "High-resolution photo of the piece (at least 1600 px on the long edge).",
          directory: "public/images/artworks",
          publicPath: "/images/artworks/",
          validation: { isRequired: true },
        }),
        video: fields.file({
          label: "Video (optional) / Video (opcional)",
          description:
            "A short process or detail clip (MP4, under ~10 MB). The image above is used as its cover and thumbnail.",
          directory: "public/images/artworks",
          publicPath: "/images/artworks/",
        }),
        alt_en: fields.text({
          label: "Image description for screen readers (English)",
          description: "What does the piece show? e.g. “A blue night sky swirling over Quito's rooftops.”",
          multiline: true,
        }),
        alt_es: fields.text({
          label: "Descripción de la imagen para lectores de pantalla (Español)",
          multiline: true,
        }),
        medium_en: fields.text({ label: "Medium (English)", description: "e.g. Acrylic on canvas" }),
        medium_es: fields.text({ label: "Técnica (Español)", description: "p. ej. Acrílico sobre lienzo" }),
        dimensions: fields.text({
          label: "Dimensions / Dimensiones",
          description: "e.g. 40 × 50 cm, or EU 38 for sneakers",
        }),
        year: fields.integer({
          label: "Year / Año",
          validation: { isRequired: true, min: 2015, max: 2100 },
        }),
        description_en: fields.text({ label: "Description (English)", multiline: true }),
        description_es: fields.text({ label: "Descripción (Español)", multiline: true }),
        featured: fields.checkbox({
          label: "Featured on the home page / Destacada en inicio",
          defaultValue: false,
        }),
        sortOrder: fields.integer({
          label: "Sort order / Orden",
          description: "Lower numbers appear first. Leave empty to sort by year.",
        }),
      },
    }),
  },
  singletons: {
    bio: singleton({
      label: "Biography / Biografía",
      path: "content/bio",
      format: { data: "yaml" },
      schema: {
        portrait: fields.image({
          label: "Portrait / Retrato",
          directory: "public/images/bio",
          publicPath: "/images/bio/",
        }),
        portraitAlt_en: fields.text({ label: "Portrait description (English)" }),
        portraitAlt_es: fields.text({ label: "Descripción del retrato (Español)" }),
        bio_en: fields.text({ label: "Biography (English)", multiline: true }),
        bio_es: fields.text({ label: "Biografía (Español)", multiline: true }),
        instagram: fields.url({ label: "Instagram URL" }),
        email: fields.text({ label: "Public contact email / Correo público" }),
      },
    }),
  },
});
