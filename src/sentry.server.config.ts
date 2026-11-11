// Sentry per il server Node di `next dev` e `next start`. Sul Worker le opzioni
// valide sono quelle di worker.ts: qui Sentry v11 applica solo `release`.
import { init } from "@sentry/nextjs";

import { sentryOptions } from "@/lib/sentry";

init(sentryOptions({ SENTRY_DSN: process.env.SENTRY_DSN }));
