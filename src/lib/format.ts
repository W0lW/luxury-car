import { SITE_TIME_ZONE } from "./dates";

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

const DATE_TIME_FORMATS: Record<Locale, Intl.DateTimeFormat> = {
  it: dateTimeFormat("it"),
  en: dateTimeFormat("en"),
};

function dateTimeFormat(locale: Locale): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    timeZone: SITE_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

/**
 * Data e ora di un istante sull'orologio di Roma, per email e messaggi:
 * "venerdì 20 novembre 2026, ore 10:00" / "Friday 20 November 2026, 10:00".
 * Lo schema è fisso (non quello di Intl, che cambia con la versione di ICU);
 * da Intl arrivano solo i nomi di giorni e mesi.
 */
export function formatDateTime(date: Date, locale: Locale): string {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Data non valida");
  }

  const parts: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
  for (const part of DATE_TIME_FORMATS[locale].formatToParts(date)) {
    parts[part.type] = part.value;
  }
  const { weekday, day, month, year, hour, minute } = parts;
  const time = locale === "it" ? `ore ${hour}:${minute}` : `${hour}:${minute}`;
  return `${weekday} ${day} ${month} ${year}, ${time}`;
}
