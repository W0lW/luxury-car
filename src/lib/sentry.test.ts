import type { ErrorEvent } from "@sentry/nextjs/cloudflare";
import { describe, expect, it } from "vitest";

import { scrubEvent, sentryOptions } from "./sentry";

describe("sentryOptions", () => {
  it.each([{}, { SENTRY_DSN: "" }, { SENTRY_DSN: "   " }])(
    "senza SENTRY_DSN Sentry resta spento (%j)",
    (env) => {
      const options = sentryOptions(env);

      expect(options.enabled).toBe(false);
      expect(options.dsn).toBeUndefined();
    },
  );

  it("con SENTRY_DSN Sentry è attivo", () => {
    const options = sentryOptions({
      SENTRY_DSN: " https://k@o1.ingest.sentry.io/2 ",
    });

    expect(options.enabled).toBe(true);
    expect(options.dsn).toBe("https://k@o1.ingest.sentry.io/2");
  });

  it("non raccoglie dati personali: utente, cookie, corpi, query, variabili locali", () => {
    const { dataCollection } = sentryOptions({});

    expect(dataCollection).toMatchObject({
      userInfo: false,
      cookies: false,
      httpBodies: [],
      urlQueryParams: false,
      stackFrameVariables: false,
      databaseQueryData: false,
      queues: false,
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
      mcp: { inputs: false, outputs: false },
    });
    // Delle intestazioni solo un elenco chiuso, senza cookie e Authorization.
    expect(dataCollection?.httpHeaders).toEqual({
      request: {
        allow: ["user-agent", "content-type", "accept-language", "cf-ray"],
      },
      response: false,
    });
  });

  it("ripulisce ogni evento prima dell'invio; il tracing resta spento", () => {
    const options = sentryOptions({});

    expect(options.beforeSend).toBe(scrubEvent);
    expect(options).not.toHaveProperty("tracesSampleRate");
  });
});

function event(partial: Partial<ErrorEvent>): ErrorEvent {
  return { type: undefined, ...partial };
}

describe("scrubEvent", () => {
  it("toglie corpo, cookie e query string della richiesta", () => {
    const result = scrubEvent(
      event({
        request: {
          method: "POST",
          url: "https://veloci.it/api/cron/backup?token=abc&page=2",
          data: { email: "a@b.it", phone: "+39 333 123 4567" },
          cookies: { "sb-auth-token": "eyJ..." },
          query_string: "token=abc&page=2",
          headers: {
            Cookie: "sb-auth-token=eyJ",
            Authorization: "Bearer abc",
            "User-Agent": "Mozilla/5.0",
            "cf-ray": "8f1e2d3c4b5a6978-FCO",
            "x-forwarded-for": "203.0.113.7",
          },
        },
      }),
    );

    expect(result?.request).toEqual({
      method: "POST",
      url: "https://veloci.it/api/cron/backup?token=[redacted]&page=2",
      headers: {
        "User-Agent": "Mozilla/5.0",
        "cf-ray": "8f1e2d3c4b5a6978-FCO",
      },
    });
  });

  it("dell'utente tiene solo l'id", () => {
    const result = scrubEvent(
      event({
        user: {
          id: "staff-1",
          email: "op@veloci.it",
          ip_address: "203.0.113.7",
          username: "op",
        },
      }),
    );

    expect(result?.user).toEqual({ id: "staff-1" });
    expect(
      scrubEvent(event({ user: { email: "a@b.it" } }))?.user,
    ).toBeUndefined();
  });

  it("toglie email e telefoni da messaggi, eccezioni, breadcrumb, extra e tag", () => {
    const result = scrubEvent(
      event({
        message: "invio a mario@example.com fallito",
        logentry: { message: "cliente %s", params: ["mario@example.com"] },
        exception: {
          values: [
            {
              type: "Error",
              value: "telefono +39 333 123 4567 non valido",
              stacktrace: {
                frames: [
                  { function: "send", vars: { email: "mario@example.com" } },
                ],
              },
            },
          ],
        },
        breadcrumbs: [
          {
            message: "fetch https://api.resend.com?to=mario@example.com",
            data: { to: "mario@example.com", status: 500 },
          },
        ],
        extra: { customerEmail: "mario@example.com", attempt: 2 },
        tags: { note: "chiamare 3331234567" },
      }),
    );

    const json = JSON.stringify(result);
    expect(json).not.toContain("mario@example.com");
    expect(json).not.toContain("333 123 4567");
    expect(json).not.toContain("3331234567");
    expect(result?.exception?.values?.[0].stacktrace?.frames?.[0]).toEqual({
      function: "send",
    });
    expect(result?.breadcrumbs?.[0].data).toEqual({
      to: "[email]",
      status: 500,
    });
    expect(result?.extra).toEqual({ customerEmail: "[redacted]", attempt: 2 });
  });

  it("lascia invariato un evento senza dati personali", () => {
    const pulito = event({
      message: "job backup fallito",
      tags: { job: "backup" },
      exception: { values: [{ type: "TypeError", value: "x is undefined" }] },
    });

    expect(scrubEvent(structuredClone(pulito))).toEqual(pulito);
  });
});
