// Errori del server (pagine, route, server action, proxy) inviati a Sentry.
// Su Cloudflare Sentry è inizializzato da worker.ts; con `next dev` (Node) da
// sentry.server.config.ts. Senza SENTRY_DSN non viene inviato nulla.
import { captureRequestError } from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
}

export const onRequestError = captureRequestError;
