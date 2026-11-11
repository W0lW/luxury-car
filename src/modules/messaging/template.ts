/**
 * Modelli di email e WhatsApp con segnaposto `{{nome}}`.
 *
 * - `validateTemplate` al salvataggio: segnaposto sconosciuti o scritti male.
 * - `renderTemplate` prima dell'invio: compila i segnaposto con i valori della
 *   richiesta nella lingua del contatto, oppure elenca quelli senza valore.
 *
 * Il testo del modello è testo semplice (textarea): la versione HTML escapa
 * modello e valori, la versione testo (WhatsApp) li lascia come sono.
 * Gli errori sono codici: i testi stanno nel pannello che li mostra.
 */
import { parsePhoneNumberFromString } from "libphonenumber-js";

import { formatDateTime, formatPrice, type Locale } from "@/lib/format";
import type { LocationType } from "@/modules/requests/schema";

import en from "../../../messages/en.json";
import it from "../../../messages/it.json";

export const PLACEHOLDERS = [
  "nome",
  "codice",
  "auto",
  "data_ritiro",
  "data_riconsegna",
  "luogo",
  "prezzo_totale",
  "acconto",
  "saldo",
  "link_acconto",
  "scadenza_link",
  "operatore",
  "telefono_azienda",
] as const;
export type Placeholder = (typeof PLACEHOLDERS)[number];

export type MessageChannel = "email" | "whatsapp";

/** Campi di `message_templates` che servono per compilare un messaggio. */
export type MessageTemplate = {
  channel: MessageChannel;
  /** Oggetto dell'email; `null` per WhatsApp. */
  subject: string | null;
  body: string;
};

/**
 * Valori grezzi della richiesta: date come istanti, importi in centesimi.
 * Servono solo quelli dei segnaposto usati nel modello.
 */
export type TemplateContext = {
  /** Lingua del contatto (`contacts.language`). */
  locale: Locale;
  contactName?: string | null;
  requestCode?: string | null;
  /** Marca e modello, es. "Lamborghini Urus". */
  vehicleName?: string | null;
  pickupAt?: Date | null;
  returnAt?: Date | null;
  pickupLocation?: { type: LocationType; address: string | null } | null;
  quoteTotalCents?: number | null;
  depositCents?: number | null;
  balanceCents?: number | null;
  /** Link Stripe dell'acconto (solo https). */
  depositLinkUrl?: string | null;
  depositLinkExpiresAt?: Date | null;
  operatorName?: string | null;
  /** `settings.phone_e164`. */
  companyPhoneE164?: string | null;
};

export type TemplateError =
  | { code: "unknownPlaceholder"; placeholder: string }
  | { code: "malformedPlaceholder" }
  /** Segnaposto usato senza valore, o con un valore non valido. */
  | { code: ValueError; placeholder: Placeholder };

export type ValueError = "missingValue" | "invalidValue";

export type ValidateResult =
  | { ok: true; placeholders: Placeholder[] }
  | { ok: false; errors: TemplateError[] };

export type RenderedMessage = {
  subject: string | null;
  /** Corpo dell'email: paragrafi `<p>`, a capo `<br>`, tutto escapato. */
  html: string;
  /** Corpo in testo semplice (WhatsApp e versione testo dell'email). */
  text: string;
};

export type RenderResult =
  | { ok: true; message: RenderedMessage }
  | { ok: false; errors: TemplateError[] };

// `{{nome}}` con spazi facoltativi dentro le graffe.
const TOKEN = /\{\{\s*([^{}\s][^{}]*?)\s*\}\}/g;
const KNOWN: ReadonlySet<string> = new Set(PLACEHOLDERS);

const LOCATION_LABELS: Record<Locale, Record<LocationType, string>> = {
  it: it.Locations,
  en: en.Locations,
};

/** Controllo al salvataggio del modello (oggetto e testo). */
export function validateTemplate(template: MessageTemplate): ValidateResult {
  const parts = [template.subject ?? "", template.body];

  if (parts.some((part) => /\{\{|\}\}/.test(part.replace(TOKEN, "")))) {
    return { ok: false, errors: [{ code: "malformedPlaceholder" }] };
  }

  const names = unique(parts.flatMap((part) => tokenNames(part)));
  const unknown = names.filter((name) => !KNOWN.has(name));
  if (unknown.length > 0) {
    return {
      ok: false,
      errors: unknown.map((placeholder) => ({
        code: "unknownPlaceholder",
        placeholder,
      })),
    };
  }
  return { ok: true, placeholders: names as Placeholder[] };
}

/**
 * Compila il modello per l'invio. Se un segnaposto usato non ha un valore
 * valido restituisce gli errori e nessun testo: il messaggio non parte.
 */
export function renderTemplate(
  template: MessageTemplate,
  context: TemplateContext,
): RenderResult {
  const validation = validateTemplate(template);
  if (!validation.ok) return validation;

  const values = new Map<Placeholder, Value>();
  const errors: TemplateError[] = [];
  for (const placeholder of validation.placeholders) {
    const value = resolveValue(placeholder, context);
    if (typeof value === "string") {
      errors.push({ code: value, placeholder });
    } else {
      values.set(placeholder, value);
    }
  }
  if (errors.length > 0) return { ok: false, errors };

  const body = normalizeNewlines(template.body);
  const textOf = (name: string) => values.get(name as Placeholder)!.text;

  return {
    ok: true,
    message: {
      subject:
        template.subject === null
          ? null
          : replaceTokens(template.subject, textOf).replace(/\s+/g, " ").trim(),
      text: replaceTokens(body, textOf),
      html: toHtml(body, (name) => values.get(name as Placeholder)!.html),
    },
  };
}

/** Valore pronto per le due versioni del messaggio. */
type Value = { text: string; html: string };

function resolveValue(
  placeholder: Placeholder,
  context: TemplateContext,
): Value | ValueError {
  const { locale } = context;
  switch (placeholder) {
    case "nome":
      return plain(context.contactName);
    case "codice":
      return plain(context.requestCode);
    case "auto":
      return plain(context.vehicleName);
    case "operatore":
      return plain(context.operatorName);
    case "data_ritiro":
      return dateTime(context.pickupAt, locale);
    case "data_riconsegna":
      return dateTime(context.returnAt, locale);
    case "scadenza_link":
      return dateTime(context.depositLinkExpiresAt, locale);
    case "prezzo_totale":
      return price(context.quoteTotalCents, locale);
    case "acconto":
      return price(context.depositCents, locale);
    case "saldo":
      return price(context.balanceCents, locale);
    case "luogo":
      return location(context.pickupLocation, locale);
    case "link_acconto":
      return link(context.depositLinkUrl);
    case "telefono_azienda":
      return phone(context.companyPhoneE164);
  }
}

function plain(value: string | null | undefined): Value | ValueError {
  const text = value?.trim();
  if (!text) return "missingValue";
  return { text, html: escapeHtml(text) };
}

function dateTime(
  value: Date | null | undefined,
  locale: Locale,
): Value | ValueError {
  if (!value) return "missingValue";
  if (Number.isNaN(value.getTime())) return "invalidValue";
  return plain(formatDateTime(value, locale));
}

function price(
  cents: number | null | undefined,
  locale: Locale,
): Value | ValueError {
  if (cents === null || cents === undefined) return "missingValue";
  if (!Number.isSafeInteger(cents) || cents < 0) return "invalidValue";
  return plain(formatPrice(cents, locale));
}

function location(
  value: TemplateContext["pickupLocation"],
  locale: Locale,
): Value | ValueError {
  if (!value) return "missingValue";
  if (value.type === "airport_flr" || value.type === "airport_psa") {
    return plain(LOCATION_LABELS[locale][value.type]);
  }
  return plain(value.address);
}

function link(value: string | null | undefined): Value | ValueError {
  const raw = value?.trim();
  if (!raw) return "missingValue";
  if (!URL.canParse(raw)) return "invalidValue";
  const url = new URL(raw);
  if (url.protocol !== "https:") return "invalidValue";
  const href = escapeHtml(url.href);
  return { text: url.href, html: `<a href="${href}">${href}</a>` };
}

function phone(value: string | null | undefined): Value | ValueError {
  const raw = value?.trim();
  if (!raw) return "missingValue";
  const parsed = parsePhoneNumberFromString(raw);
  if (!parsed?.isValid()) return "invalidValue";
  return plain(parsed.formatInternational());
}

function tokenNames(text: string): string[] {
  return Array.from(text.matchAll(TOKEN), (match) => match[1]!);
}

function replaceTokens(text: string, valueOf: (name: string) => string) {
  return text.replace(TOKEN, (_token, name: string) => valueOf(name));
}

/**
 * Corpo HTML: il testo del modello è escapato, i valori arrivano già pronti;
 * le righe vuote separano i paragrafi, un a capo diventa `<br>`.
 */
function toHtml(body: string, htmlOf: (name: string) => string): string {
  let html = "";
  let last = 0;
  for (const match of body.matchAll(TOKEN)) {
    html += escapeHtml(body.slice(last, match.index)) + htmlOf(match[1]!);
    last = match.index + match[0].length;
  }
  html += escapeHtml(body.slice(last));

  return html
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== "")
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]!);
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}
