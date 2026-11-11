// Punto d'ingresso del Worker (`main` in wrangler.jsonc): il gestore generato da
// OpenNext avvolto da Sentry (https://opennext.js.org/cloudflare/howtos/custom-worker).
// Qui andranno anche gli altri gestori del Worker, es. `scheduled` per i job.
import { withSentry } from "@sentry/nextjs/cloudflare";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- vedi sotto
// @ts-ignore generato da `opennextjs-cloudflare build`: manca prima della build
import openNextHandler from "./.open-next/worker.js";

import { sentryOptions } from "./src/lib/sentry";

/** Variabili non dichiarate in wrangler.jsonc: arrivano come secret del Worker. */
type WorkerEnv = CloudflareEnv & { SENTRY_DSN?: string };

const handler = openNextHandler as ExportedHandler<WorkerEnv>;

// Senza SENTRY_DSN Sentry resta spento e il gestore risponde come prima.
export default withSentry((env: WorkerEnv) => sentryOptions(env), handler);
