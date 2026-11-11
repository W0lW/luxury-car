// Opzioni comuni di Sentry: Worker (worker.ts, `withSentry`) e `next dev`
// (src/sentry.server.config.ts). Senza SENTRY_DSN Sentry non invia nulla.
//
// Sentry v11 ha tolto `sendDefaultPii`: i dati raccolti si scelgono con
// `dataCollection`, i cui valori predefiniti raccolgono tutto. Qui ogni categoria è
// spenta e `scrubEvent` ripulisce comunque ogni evento prima dell'invio.
// Tracing spento (niente `tracesSampleRate`): solo errori, quota gratuita di Sentry.
import type {
  CloudflareOptions,
  ErrorEvent,
  Event,
  RequestEventData,
} from "@sentry/nextjs/cloudflare";

import { redact } from "./logger";

type SentryEnv = { SENTRY_DSN?: string };

/** Intestazioni della richiesta che possono finire negli eventi. */
const ALLOWED_REQUEST_HEADERS = [
  "user-agent",
  "content-type",
  "accept-language",
  "cf-ray",
];

export function sentryOptions(env: SentryEnv) {
  const dsn = env.SENTRY_DSN?.trim() || undefined;

  return {
    dsn,
    enabled: dsn !== undefined,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: {
        request: { allow: ALLOWED_REQUEST_HEADERS },
        response: false,
      },
      httpBodies: [],
      urlQueryParams: false,
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
      mcp: { inputs: false, outputs: false },
      databaseQueryData: false,
      queues: false,
      stackFrameVariables: false,
    },
    beforeSend: scrubEvent,
  } satisfies CloudflareOptions;
}

function redactString<T>(value: T): T {
  return typeof value === "string" ? (redact(value) as T) : value;
}

function scrubRequest(request: RequestEventData): RequestEventData {
  // Fuori corpo (data), cookie e query string; delle intestazioni solo l'elenco chiuso.
  const result: RequestEventData = { ...request };
  delete result.data;
  delete result.cookies;
  delete result.query_string;
  if (request.url) result.url = redactString(request.url);
  if (request.headers) {
    result.headers = Object.fromEntries(
      Object.entries(request.headers).filter(([name]) =>
        ALLOWED_REQUEST_HEADERS.includes(name.toLowerCase()),
      ),
    );
  }
  return result;
}

/**
 * Toglie da un evento Sentry corpo, cookie e query string delle richieste, i dati
 * dell'utente (resta l'id), le variabili locali, email, telefoni e token nei testi.
 */
export function scrubEvent<T extends Event>(event: T): T;
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) event.request = scrubRequest(event.request);

  if (event.user) {
    if (event.user.id !== undefined) event.user = { id: event.user.id };
    else delete event.user;
  }

  if (event.message) event.message = redactString(event.message);
  if (event.logentry)
    event.logentry = redact(event.logentry) as typeof event.logentry;

  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = redactString(exception.value);
    for (const frame of exception.stacktrace?.frames ?? []) delete frame.vars;
  }

  for (const breadcrumb of event.breadcrumbs ?? []) {
    if (breadcrumb.message)
      breadcrumb.message = redactString(breadcrumb.message);
    if (breadcrumb.data)
      breadcrumb.data = redact(breadcrumb.data) as typeof breadcrumb.data;
  }

  if (event.extra) event.extra = redact(event.extra) as typeof event.extra;
  if (event.tags) event.tags = redact(event.tags) as typeof event.tags;
  if (event.contexts)
    event.contexts = redact(event.contexts) as typeof event.contexts;

  return event;
}
