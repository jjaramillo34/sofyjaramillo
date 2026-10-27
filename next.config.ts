import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Keystatic's GitHub mode moves the admin from localhost to 127.0.0.1 (its
  // OAuth callback host); without this, the dev server blocks hot reload there.
  // Development only, and the same machine.
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    // Without this, a server component that imports from the Once UI package
    // root ships about 110 kB of extra JavaScript on every route.
    optimizePackageImports: ["@once-ui-system/core"],
  },
  turbopack: {
    rules: {
      "*.css": {
        // Only our own global CSS: running node_modules' *.module.css through this
        // rule turns them into plain CSS and strips Once UI's scoped class names.
        condition: { all: [{ not: "foreign" }, { not: { path: /\.module\.css$/ } }] },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
