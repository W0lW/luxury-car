import { describe, expect, it } from "vitest";

import { createLogger, redact, type LogLevel } from "./logger";

function capture(level?: LogLevel) {
  const lines: { level: LogLevel; line: string }[] = [];
  const logger = createLogger({
    level,
    now: () => new Date("2026-11-11T08:00:00.000Z"),
    write: (entryLevel, line) => lines.push({ level: entryLevel, line }),
  });
  const entries = () =>
    lines.map((l) => JSON.parse(l.line) as Record<string, unknown>);
  return { logger, lines, entries };
}

describe("createLogger", () => {
  it("scrive una riga JSON con ora, livello, messaggio e contesto", () => {
    const { logger, lines } = capture();

    logger.info("richiesta salvata", { requestId: "r-1", amountCents: 12500 });

    expect(lines).toHaveLength(1);
    expect(lines[0].level).toBe("info");
    expect(JSON.parse(lines[0].line)).toEqual({
      time: "2026-11-11T08:00:00.000Z",
      level: "info",
      msg: "richiesta salvata",
      requestId: "r-1",
      amountCents: 12500,
    });
  });

  it("scarta i livelli sotto la soglia (predefinita: info)", () => {
    const { logger, entries } = capture();

    logger.debug("dettaglio");
    logger.info("info");
    logger.warn("avviso");
    logger.error("errore");

    expect(entries().map((e) => e.level)).toEqual(["info", "warn", "error"]);
  });

  it("con soglia debug scrive tutto, con soglia error solo gli errori", () => {
    const tutto = capture("debug");
    tutto.logger.debug("a");
    tutto.logger.info("b");
    expect(tutto.entries()).toHaveLength(2);

    const soloErrori = capture("error");
    soloErrori.logger.warn("a");
    soloErrori.logger.error("b");
    expect(soloErrori.entries().map((e) => e.msg)).toEqual(["b"]);
  });

  it("il logger figlio aggiunge i suoi campi a ogni riga", () => {
    const { logger, entries } = capture();

    logger.child({ module: "requests" }).warn("lento", { ms: 1200 });

    expect(entries()[0]).toMatchObject({
      module: "requests",
      msg: "lento",
      ms: 1200,
    });
  });

  it("serializza gli errori con nome, messaggio e stack", () => {
    const { logger, entries } = capture();
    const error = new TypeError("valore mancante");

    logger.error("invio fallito", { error });

    const logged = entries()[0].error as Record<string, unknown>;
    expect(logged.name).toBe("TypeError");
    expect(logged.message).toBe("valore mancante");
    expect(typeof logged.stack).toBe("string");
  });

  it("non va in errore con riferimenti circolari", () => {
    const { logger, entries } = capture();
    const ciclo: Record<string, unknown> = { nome: "a" };
    ciclo.self = ciclo;

    logger.info("ciclo", { ciclo });

    expect(entries()[0].ciclo).toEqual({ nome: "a", self: "[circular]" });
  });

  it("rimuove i dati personali da messaggio, contesto ed errori", () => {
    const { logger, lines } = capture();

    logger.error("invio a mario.rossi@example.com fallito", {
      error: new Error("telefono +39 333 123 4567 non raggiungibile"),
      note: "richiamare il 3331234567",
    });

    const line = lines[0].line;
    expect(line).not.toContain("mario.rossi@example.com");
    expect(line).not.toContain("333 123 4567");
    expect(line).not.toContain("3331234567");
    expect(line).toContain("[email]");
    expect(line).toContain("[phone]");
  });
});

describe("redact", () => {
  it.each([
    ["mario.rossi@example.com", "[email]"],
    [
      "scrivere a Info.Veloci+test@sub.example.it oggi",
      "scrivere a [email] oggi",
    ],
  ])("toglie l'email da %j", (input, expected) => {
    expect(redact(input)).toBe(expected);
  });

  it.each([
    "+39 333 123 4567",
    "+393331234567",
    "0039 055 123456",
    "333 1234567",
    "333-123-4567",
    "055 1234567",
    "+44 20 7946 0958",
    "+1 (415) 555-0132",
  ])("toglie il telefono %j", (phone) => {
    expect(redact(`chiamare ${phone} subito`)).toBe("chiamare [phone] subito");
  });

  it.each([
    "2026-11-11",
    "2026-11-11 08:27",
    "2026-11-11T08:27:00.000Z",
    "importo 12500 centesimi",
    "1.250.000 €",
    "id 7f3c9a2e-1b4d-4c8e-9f60-2a5b7c8d9e01",
    "auto 4 posti, 2 porte, 650 CV",
  ])("lascia invariati date, importi e id: %j", (text) => {
    expect(redact(text)).toBe(text);
  });

  it("toglie token JWT, intestazioni Authorization e chiavi note", () => {
    const jwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.c2lnbmF0dXJhLWZpbnRh";

    expect(redact(`token ${jwt}`)).toBe("token [token]");
    expect(redact("Authorization: Bearer abc.def-123_xyz")).toBe(
      "Authorization: Bearer [token]",
    );
    expect(redact("chiave sk_test_51AbCdEfGhIjKlMn usata")).toBe(
      "chiave [token] usata",
    );
    expect(redact("firma whsec_AbCdEf123456789 errata")).toBe(
      "firma [token] errata",
    );
    expect(redact("chiave sb_secret_AbCdEf123456789")).toBe("chiave [token]");
  });

  it("toglie token e segreti dai parametri delle URL", () => {
    expect(
      redact("/api/cron/backup?token=abc123&page=2&access_token=xyz"),
    ).toBe("/api/cron/backup?token=[redacted]&page=2&access_token=[redacted]");
  });

  it("toglie i cookie dalle intestazioni scritte nel testo", () => {
    expect(redact("Cookie: sb-abc-auth-token=base64-xyz; theme=dark")).toBe(
      "Cookie: [redacted]",
    );
    expect(redact("set-cookie: session=abc; Path=/; HttpOnly")).toBe(
      "set-cookie: [redacted]",
    );
  });

  it("toglie del tutto i valori dei campi sensibili, a ogni livello", () => {
    expect(
      redact({
        email: "a@b.it",
        customerPhone: "+39 333 123 4567",
        telefono: "3331234567",
        password: "segreta",
        accessToken: "abc",
        refresh_token: "def",
        cookie: "a=b",
        headers: { Authorization: "Basic xyz", "Set-Cookie": ["a=b"] },
        apiKey: "k",
        stripeSignature: "t=1,v1=abc",
        CRON_SECRET: "c",
        emailStatus: "delivered",
        requestId: "r-1",
      }),
    ).toEqual({
      email: "[redacted]",
      customerPhone: "[redacted]",
      telefono: "[redacted]",
      password: "[redacted]",
      accessToken: "[redacted]",
      refresh_token: "[redacted]",
      cookie: "[redacted]",
      headers: { Authorization: "[redacted]", "Set-Cookie": "[redacted]" },
      apiKey: "[redacted]",
      stripeSignature: "[redacted]",
      CRON_SECRET: "[redacted]",
      emailStatus: "delivered",
      requestId: "r-1",
    });
  });

  it("toglie i dati personali dentro array e testi annidati", () => {
    expect(redact({ to: ["a@b.it", "c@d.com"], n: 3, ok: true })).toEqual({
      to: ["[email]", "[email]"],
      n: 3,
      ok: true,
    });
  });

  it("non modifica l'oggetto originale", () => {
    const input = { email: "a@b.it" };
    redact(input);
    expect(input.email).toBe("a@b.it");
  });
});
