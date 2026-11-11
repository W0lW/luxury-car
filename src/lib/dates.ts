/**
 * Orari del sito: nel database in UTC (`timestamptz`), per le persone sempre
 * nell'ora di Roma (sede dell'azienda e luogo del noleggio).
 */
export const SITE_TIME_ZONE = "Europe/Rome";

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

// Valore di <input type="datetime-local">: "AAAA-MM-GGTHH:mm" con secondi facoltativi.
const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

const romeParts = new Intl.DateTimeFormat("en-US", {
  timeZone: SITE_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
});

/** Minuti di differenza tra l'ora di Roma e UTC in un istante (60 o 120). */
function romeOffsetMinutes(instantMs: number): number {
  const parts: Record<string, number> = {};
  for (const part of romeParts.formatToParts(new Date(instantMs))) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  const clockMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  const wholeSecondMs = instantMs - (((instantMs % 1000) + 1000) % 1000);
  return Math.round((clockMs - wholeSecondMs) / MINUTE_MS);
}

/**
 * Legge l'orario di un campo `datetime-local` come ora di Roma e restituisce
 * l'istante corrispondente (UTC), oppure `null` se il valore non è valido.
 *
 * Al cambio dell'ora: un orario che non esiste (primavera) va avanti della
 * durata del salto; un orario che esiste due volte (autunno) prende il primo.
 */
export function parseRomeDateTime(value: string): Date | null {
  const match = LOCAL_DATE_TIME.exec(value);
  if (!match) return null;

  const [year, month, day, hour, minute, second = 0] = match
    .slice(1)
    .map((part) => (part === undefined ? undefined : Number(part)));
  if (hour! > 23 || minute! > 59 || second > 59) return null;

  // L'orario "da orologio" trattato come se fosse UTC.
  const clockMs = Date.UTC(year!, month! - 1, day!, hour, minute, second);
  const check = new Date(clockMs);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month! - 1 ||
    check.getUTCDate() !== day
  ) {
    return null; // es. 30 febbraio o mese 13
  }

  const offsetBefore = romeOffsetMinutes(clockMs - DAY_MS);
  const offsetAfter = romeOffsetMinutes(clockMs + DAY_MS);
  const matches = [offsetBefore, offsetAfter]
    .map((offset) => clockMs - offset * MINUTE_MS)
    .filter(
      (instant) => romeOffsetMinutes(instant) * MINUTE_MS === clockMs - instant,
    );

  if (matches.length > 0) return new Date(Math.min(...matches));
  // Orario saltato dal cambio dell'ora: si usa la differenza di prima del salto.
  return new Date(clockMs - offsetBefore * MINUTE_MS);
}

/**
 * Ore tra due istanti contate sull'orologio di Roma: il cambio dell'ora non
 * conta (dalle 10 alle 10 del giorno dopo sono sempre 24 ore).
 */
export function romeClockHoursBetween(from: Date, to: Date): number {
  const fromClock = from.getTime() + romeOffsetMinutes(from.getTime()) * MINUTE_MS;
  const toClock = to.getTime() + romeOffsetMinutes(to.getTime()) * MINUTE_MS;
  return (toClock - fromClock) / HOUR_MS;
}
