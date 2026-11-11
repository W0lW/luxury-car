import { describe, expect, it } from "vitest";

import {
  createImageLoader,
  IMAGE_VARIANT_WIDTHS,
  pickVariantWidth,
} from "./image-loader";

describe("pickVariantWidth", () => {
  it("le varianti sono quelle della sezione 9.5, in ordine crescente", () => {
    expect(IMAGE_VARIANT_WIDTHS).toEqual([640, 1024, 1600, 2400]);
  });

  it("restituisce la variante esatta quando la larghezza coincide", () => {
    for (const width of IMAGE_VARIANT_WIDTHS) {
      expect(pickVariantWidth(width)).toBe(width);
    }
  });

  it("sceglie la variante più piccola che copre la larghezza richiesta (mai sgranata)", () => {
    expect(pickVariantWidth(1)).toBe(640);
    expect(pickVariantWidth(384)).toBe(640);
    expect(pickVariantWidth(641)).toBe(1024);
    expect(pickVariantWidth(1080)).toBe(1600);
    expect(pickVariantWidth(1920)).toBe(2400);
  });

  it("oltre la variante più grande restituisce la più grande", () => {
    expect(pickVariantWidth(2401)).toBe(2400);
    expect(pickVariantWidth(3840)).toBe(2400);
  });
});

describe("createImageLoader", () => {
  const loader = createImageLoader("https://img.example.it");

  it("costruisce l'URL della variante WebP su R2 dalla chiave della foto", () => {
    expect(loader({ src: "vehicles/abc/123", width: 1200 })).toBe(
      "https://img.example.it/vehicles/abc/123-1600.webp",
    );
  });

  it("ignora la qualità: le varianti sono già compresse", () => {
    expect(loader({ src: "vehicles/abc/123", width: 640, quality: 30 })).toBe(
      "https://img.example.it/vehicles/abc/123-640.webp",
    );
  });

  it("accetta il dominio con la barra finale", () => {
    const withSlash = createImageLoader("https://img.example.it/");
    expect(withSlash({ src: "vehicles/abc/123", width: 2400 })).toBe(
      "https://img.example.it/vehicles/abc/123-2400.webp",
    );
  });

  it("lascia invariati i file di public/ (percorsi che iniziano con /)", () => {
    expect(loader({ src: "/logo.svg", width: 640 })).toBe("/logo.svg");
  });

  it("lascia invariati gli URL assoluti", () => {
    expect(
      loader({ src: "https://cdn.example.com/foto.webp", width: 640 }),
    ).toBe("https://cdn.example.com/foto.webp");
  });

  it("senza dominio immagini usa un percorso relativo al sito", () => {
    const local = createImageLoader(undefined);
    expect(local({ src: "vehicles/abc/123", width: 700 })).toBe(
      "/vehicles/abc/123-1024.webp",
    );
  });
});
