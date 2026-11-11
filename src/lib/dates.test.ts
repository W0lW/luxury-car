import { describe, expect, it } from "vitest";

import { parseRomeDateTime, romeClockHoursBetween } from "./dates";

describe("parseRomeDateTime", () => {
  it("legge un orario d'inverno come ora di Roma (UTC+1)", () => {
    expect(parseRomeDateTime("2026-11-20T10:00")?.toISOString()).toBe(
      "2026-11-20T09:00:00.000Z",
    );
  });

  it("legge un orario d'estate come ora di Roma (UTC+2)", () => {
    expect(parseRomeDateTime("2027-07-15T18:30")?.toISOString()).toBe(
      "2027-07-15T16:30:00.000Z",
    );
  });

  it("accetta anche i secondi", () => {
    expect(parseRomeDateTime("2026-11-20T10:00:45")?.toISOString()).toBe(
      "2026-11-20T09:00:45.000Z",
    );
  });

  it("un orario che non esiste (cambio dell'ora in primavera) va avanti di un'ora", () => {
    // 28/03/2027: alle 02:00 gli orologi passano alle 03:00.
    expect(parseRomeDateTime("2027-03-28T02:30")?.toISOString()).toBe(
      "2027-03-28T01:30:00.000Z",
    );
  });

  it("un orario che esiste due volte (cambio dell'ora in autunno) prende il primo", () => {
    // 31/10/2027: alle 03:00 gli orologi tornano alle 02:00.
    expect(parseRomeDateTime("2027-10-31T02:30")?.toISOString()).toBe(
      "2027-10-31T00:30:00.000Z",
    );
  });

  it.each([
    "",
    "domani",
    "2026-11-20",
    "2026-11-20 10:00",
    "2026-11-20T10:00Z",
    "2026-11-20T10:00+01:00",
    "2026-02-30T10:00",
    "2026-13-01T10:00",
    "2026-11-20T24:00",
    "2026-11-20T10:60",
  ])("rifiuta %j", (value) => {
    expect(parseRomeDateTime(value)).toBeNull();
  });
});

describe("romeClockHoursBetween", () => {
  it("conta le ore dell'orologio di Roma", () => {
    const from = parseRomeDateTime("2026-11-20T10:00")!;
    const to = parseRomeDateTime("2026-11-23T16:00")!;
    expect(romeClockHoursBetween(from, to)).toBe(78);
  });

  it("ignora il cambio dell'ora: dalle 10 alle 10 del giorno dopo sono 24 ore", () => {
    // Nella notte tra 24 e 25 ottobre 2026 l'ora torna indietro (25 ore reali).
    const from = parseRomeDateTime("2026-10-24T10:00")!;
    const to = parseRomeDateTime("2026-10-25T10:00")!;
    expect(to.getTime() - from.getTime()).toBe(25 * 3_600_000);
    expect(romeClockHoursBetween(from, to)).toBe(24);
  });

  it("è negativo se il secondo orario viene prima", () => {
    const from = parseRomeDateTime("2026-11-20T10:00")!;
    const to = parseRomeDateTime("2026-11-20T08:30")!;
    expect(romeClockHoursBetween(from, to)).toBe(-1.5);
  });
});
