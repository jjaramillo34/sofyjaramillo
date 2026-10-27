import type { OnceUIDataStyleConfig, OnceUIStyleConfig } from "@once-ui-system/core";

// Starry Night palette: deep night blues as the brand, sunflower gold as the
// accent, warm ochre-tinted sand neutrals.
export const style: OnceUIStyleConfig = {
  // Keep "system" so the visitor's preference is respected; defaultTheme picks the first visit.
  theme: "system",
  defaultTheme: "dark",
  neutral: "sand",
  brand: "blue",
  accent: "yellow",
  solid: "color",
  solidStyle: "plastic",
  border: "playful",
  surface: "translucent",
  transition: "all",
  scaling: "100",
};

export const dataStyle: OnceUIDataStyleConfig = {
  variant: "gradient",
  mode: "categorical",
  height: 24,
  axis: { stroke: "var(--neutral-alpha-weak)" },
  tick: { fill: "var(--neutral-on-background-weak)", fontSize: 11, line: false },
};
