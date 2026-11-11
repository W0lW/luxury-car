/** Lingue del sito: italiano alla radice, inglese sotto /en. */
export type Locale = "it" | "en";

const INTL_LOCALE: Record<Locale, string> = {
  it: "it-IT",
  en: "en-GB",
};

/**
 * Formatta un importo salvato in centesimi (integer) come prezzo in euro.
 * Gli euro interi si mostrano senza decimali, altrimenti con due.
 */
export function formatPrice(amountCents: number, locale: Locale): string {
  if (!Number.isSafeInteger(amountCents)) {
    throw new RangeError(
      `Importo non valido: ${amountCents} (servono centesimi interi)`,
    );
  }

  const wholeEuros = amountCents % 100 === 0;
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: wholeEuros ? 0 : 2,
    maximumFractionDigits: wholeEuros ? 0 : 2,
  }).format(amountCents / 100);
}
