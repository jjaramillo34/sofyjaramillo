// Kept apart from keystatic.config.ts on purpose: client components need this
// list, and importing it from the Keystatic config would pull the whole
// Keystatic editor (~2.4 MB, with syntax older Safari can't parse) into every page.
export const artworkCategories = ["paintings", "drawings", "wearables"] as const;
export type ArtworkCategory = (typeof artworkCategories)[number];
