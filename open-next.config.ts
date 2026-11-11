// Configurazione di OpenNext per Cloudflare (https://opennext.js.org/cloudflare/caching).
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

export default defineCloudflareConfig({
  // Cache incrementale di Next.js sul bucket R2 del binding NEXT_INC_CACHE_R2_BUCKET.
  incrementalCache: r2IncrementalCache,
});
