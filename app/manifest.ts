import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sofy Jaramillo — Art & Commissions",
    short_name: "Sofy Jaramillo",
    description:
      "Paintings, drawings and hand-painted wearable art by Sofia Yaneli Jaramillo Bustos, a young artist from Ecuador inspired by Van Gogh.",
    start_url: "/",
    display: "standalone",
    background_color: "#081338",
    theme_color: "#081338",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
