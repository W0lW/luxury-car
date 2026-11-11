import type { NextConfig } from "next";

import { IMAGE_VARIANT_WIDTHS } from "./src/lib/image-loader";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Nessuna ottimizzazione a runtime (PRD 9.5): il loader sceglie una delle
  // varianti WebP già pronte su R2, e srcset usa solo quelle larghezze.
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    deviceSizes: [...IMAGE_VARIANT_WIDTHS],
    imageSizes: [],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

// Binding di Cloudflare (R2, Workers AI, ...) disponibili anche con `next dev`.
import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
