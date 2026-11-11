import { describe, expect, it } from "vitest";

import { formatDateTime, formatPrice } from "./format";

// Intl separa cifra e simbolo con uno spazio non divisibile (U+00A0).
const NBSP = " ";

describe("formatPrice", () => {
  it("mostra gli euro interi senza decimali in italiano", () => {
    expect(formatPrice(45_000, "it")).toBe(`450${NBSP}€`);
  });

  it("raggruppa le migliaia con il punto in italiano", () => {
    expect(formatPrice(1_250_000, "it")).toBe(`12.500${NBSP}€`);
  });

  it("mostra due decimali quando ci sono i centesimi", () => {
    expect(formatPrice(9_990, "it")).toBe(`99,90${NBSP}€`);
    expect(formatPrice(9_990, "en")).toBe("€99.90");
  });

  it("usa il formato inglese sotto /en", () => {
    expect(formatPrice(1_250_000, "en")).toBe("€12,500");
  });

  it("accetta zero", () => {
    expect(formatPrice(0, "it")).toBe(`0${NBSP}€`);
  });

  it("rifiuta importi che non sono centesimi interi", () => {
    expect(() => formatPrice(10.5, "it")).toThrow(RangeError);
    expect(() => formatPrice(Number.NaN, "it")).toThrow(RangeError);
  });
});

describe("formatDateTime", () => {
  it("mostra giorno, data e ora di Roma in italiano (ora solare)", () => {
    // 09:00 UTC = 10:00 a Roma in inverno.
    expect(formatDateTime(new Date("2026-11-20T09:00:00Z"), "it")).toBe(
      "venerdì 20 novembre 2026, ore 10:00",
    );
  });

  it("usa l'ora legale di Roma d'estate", () => {
    // 08:00 UTC = 10:00 a Roma in estate.
    expect(formatDateTime(new Date("2026-07-01T08:00:00Z"), "it")).toBe(
      "mercoledì 1 luglio 2026, ore 10:00",
    );
  });

  it("usa il formato inglese con l'orologio a 24 ore", () => {
    expect(formatDateTime(new Date("2026-11-20T14:05:00Z"), "en")).toBe(
      "Friday 20 November 2026, 15:05",
    );
  });

  it("conta il giorno sull'orologio di Roma, non su quello UTC", () => {
    // 31 dicembre alle 23:30 UTC è già il 1° gennaio a Roma.
    expect(formatDateTime(new Date("2026-12-31T23:30:00Z"), "it")).toBe(
      "venerdì 1 gennaio 2027, ore 00:30",
    );
  });

  it("rifiuta una data non valida", () => {
    expect(() => formatDateTime(new Date("non una data"), "it")).toThrow(
      RangeError,
    );
  });
});
