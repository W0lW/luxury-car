import { describe, expect, it } from "vitest";

import { formatPrice } from "./format";

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
