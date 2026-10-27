import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
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
