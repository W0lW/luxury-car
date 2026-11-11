import type { ImageLoaderProps } from "next/image";

/**
 * Loader di `next/image` (PRD 9.5): nessuna ottimizzazione a runtime.
 *
 * Ogni foto è caricata su R2 in 4 varianti WebP già pronte, con chiavi
 * `<chiave>-<larghezza>.webp` (es. `vehicles/<id>/<uuid>-1024.webp`, US-025).
 * A `next/image` si passa come `src` la chiave senza larghezza ed estensione
 * (`vehicles/<id>/<uuid>`); il loader sceglie la variante adatta.
 *
 * - Percorsi che iniziano con `/` (file di `public/`) e URL assoluti restano
 *   invariati: per SVG e loghi usare `unoptimized`.
 * - `quality` è ignorata: le varianti sono già compresse.
 */

/** Larghezze delle varianti su R2, in ordine crescente. */
export const IMAGE_VARIANT_WIDTHS = [640, 1024, 1600, 2400] as const;

export type ImageVariantWidth = (typeof IMAGE_VARIANT_WIDTHS)[number];

/** La variante più piccola che copre `width`; oltre la più grande, la più grande. */
export function pickVariantWidth(width: number): ImageVariantWidth {
  const largest = IMAGE_VARIANT_WIDTHS[IMAGE_VARIANT_WIDTHS.length - 1];
  return IMAGE_VARIANT_WIDTHS.find((variant) => variant >= width) ?? largest;
}

export function createImageLoader(baseUrl: string | undefined) {
  const base = (baseUrl ?? "").replace(/\/+$/, "");

  return function imageLoader({ src, width }: ImageLoaderProps): string {
    if (src.startsWith("/") || /^https?:\/\//.test(src)) {
      return src;
    }
    return `${base}/${src}-${pickVariantWidth(width)}.webp`;
  };
}

// Il nome completo `process.env.NEXT_PUBLIC_...` serve a Next per inserirne il valore nel bundle.
export default createImageLoader(process.env.NEXT_PUBLIC_IMAGES_BASE_URL);
