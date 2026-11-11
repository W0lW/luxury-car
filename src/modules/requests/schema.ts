/**
 * Regole della richiesta di noleggio, condivise da browser (modulo) e server
 * (server action). Gli errori sono codici: i testi IT/EN stanno in
 * `messages/*.json` sotto `BookingRequestForm.errors`.
 */
import { parsePhoneNumberFromString } from "libphonenumber-js";
import * as z from "zod";

import { parseRomeDateTime, romeClockHoursBetween } from "@/lib/dates";

export type RequestRules = {
  /** `settings.min_lead_hours`: ore minime tra l'invio e il ritiro. */
  minLeadHours: number;
  /** `settings.max_rental_days`: durata massima del noleggio. */
  maxRentalDays: number;
};

/** Valori iniziali di `settings` (sezione 9.9 del PRD). */
export const DEFAULT_REQUEST_RULES: Readonly<RequestRules> = {
  minLeadHours: 24,
  maxRentalDays: 90,
};

export type RequestRuleOptions = Partial<RequestRules> & {
  /** Momento dell'invio; se manca, l'orario attuale di ogni controllo. */
  now?: Date;
};

export const LOCATION_TYPES = [
  "airport_flr",
  "airport_psa",
  "hotel",
  "address",
  "other",
] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

/** Luoghi per cui serve l'indirizzo (o il nome dell'hotel). */
const LOCATIONS_WITH_ADDRESS: ReadonlySet<unknown> = new Set<LocationType>([
  "hotel",
  "address",
  "other",
]);

export const EXTRAS = ["extra_insurance", "chauffeur"] as const;
export type Extra = (typeof EXTRAS)[number];

export const PREFERRED_CHANNELS = ["email", "phone", "whatsapp"] as const;
export type PreferredChannel = (typeof PREFERRED_CHANNELS)[number];

export const REQUEST_ERROR_CODES = [
  "invalid",
  "dateRequired",
  "dateInvalid",
  "pickupTooSoon",
  "returnBeforePickup",
  "durationTooShort",
  "durationTooLong",
  "locationRequired",
  "addressRequired",
  "vehicleInvalid",
  "kmInvalid",
  "extraInvalid",
  "tooLong",
  "nameRequired",
  "emailRequired",
  "emailInvalid",
  "phoneRequired",
  "phoneInvalid",
  "channelRequired",
  "privacyRequired",
] as const;
export type RequestErrorCode = (typeof REQUEST_ERROR_CODES)[number];

const MIN_RENTAL_HOURS = 24; // durata minima: 1 giorno
const MAX_NAME_LENGTH = 120;
const MAX_ADDRESS_LENGTH = 200;
const MAX_NOTES_LENGTH = 2000;
const MAX_EXPECTED_KM = 100_000;
const DEFAULT_PHONE_COUNTRY = "IT";
const HOUR_MS = 3_600_000;

// --- Normalizzazione dei valori di un modulo HTML ---------------------------

function trim(value: unknown): unknown {
  return typeof value === "string" ? value.trim() : value;
}

function emptyToUndefined(value: unknown): unknown {
  const trimmed = trim(value);
  return trimmed === "" || trimmed === null ? undefined : trimmed;
}

/** Checkbox: "on" e "true" valgono `true`. */
function checkboxValue(value: unknown): unknown {
  return value === "on" || value === "true" ? true : value;
}

/** Checkbox facoltativa: non spuntata (assente, vuota, "false") vale `false`. */
function optionalCheckboxValue(value: unknown): unknown {
  const checked = checkboxValue(value);
  return checked === undefined ||
    checked === null ||
    checked === "" ||
    checked === "false"
    ? false
    : checked;
}

// --- Campi -------------------------------------------------------------------

function dateTimeField() {
  return z.preprocess(
    trim,
    z
      .string({ error: "dateRequired" })
      .min(1, { error: "dateRequired" })
      .transform((value, ctx) => {
        const date = parseRomeDateTime(value);
        if (!date) {
          ctx.addIssue({ code: "custom", message: "dateInvalid" });
          return z.NEVER;
        }
        return date;
      }),
  );
}

function optionalText(max: number) {
  return z.preprocess(
    emptyToUndefined,
    z.string({ error: "invalid" }).max(max, { error: "tooLong" }).optional(),
  );
}

const locationField = z.enum(LOCATION_TYPES, { error: "locationRequired" });

const rentalShape = {
  /** `null` = "Consigliatemi voi". */
  vehicleId: z.preprocess(
    (value) => emptyToUndefined(value) ?? null,
    z.uuid({ error: "vehicleInvalid" }).nullable(),
  ),
  pickupAt: dateTimeField(),
  returnAt: dateTimeField(),
  pickupLocation: locationField,
  pickupAddress: optionalText(MAX_ADDRESS_LENGTH),
  returnLocation: locationField,
  returnAddress: optionalText(MAX_ADDRESS_LENGTH),
  expectedKm: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: "kmInvalid" })
      .int({ error: "kmInvalid" })
      .min(0, { error: "kmInvalid" })
      .max(MAX_EXPECTED_KM, { error: "kmInvalid" })
      .optional(),
  ),
  secondDriver: z.preprocess(
    optionalCheckboxValue,
    z.boolean({ error: "invalid" }),
  ),
  extras: z.preprocess(
    (value) =>
      value === undefined || value === null || value === ""
        ? []
        : typeof value === "string"
          ? [value]
          : value,
    z
      .array(z.enum(EXTRAS, { error: "extraInvalid" }), {
        error: "extraInvalid",
      })
      .transform((extras) => [...new Set(extras)]),
  ),
  notes: optionalText(MAX_NOTES_LENGTH),
};

const contactShape = {
  fullName: z.preprocess(
    trim,
    z
      .string({ error: "nameRequired" })
      .min(1, { error: "nameRequired" })
      .max(MAX_NAME_LENGTH, { error: "tooLong" }),
  ),
  email: z.preprocess(
    trim,
    z
      .string({ error: "emailRequired" })
      .min(1, { error: "emailRequired" })
      .pipe(
        z.email({ error: "emailInvalid" }).max(254, { error: "emailInvalid" }),
      ),
  ),
  /** Convertito in E.164 (es. "+393331234567"); senza prefisso vale l'Italia. */
  phone: z.preprocess(
    trim,
    z
      .string({ error: "phoneRequired" })
      .min(1, { error: "phoneRequired" })
      .max(32, { error: "phoneInvalid" })
      .transform((value, ctx) => {
        const phone = parsePhoneNumberFromString(value, DEFAULT_PHONE_COUNTRY);
        if (!phone?.isValid()) {
          ctx.addIssue({ code: "custom", message: "phoneInvalid" });
          return z.NEVER;
        }
        return phone.number;
      }),
  ),
  preferredChannel: z.enum(PREFERRED_CHANNELS, { error: "channelRequired" }),
  privacyAccepted: z.preprocess(
    checkboxValue,
    z.literal(true, { error: "privacyRequired" }),
  ),
  /** Separato dalla privacy e mai preselezionato. */
  marketingConsent: z.preprocess(
    optionalCheckboxValue,
    z.boolean({ error: "invalid" }),
  ),
};

// --- Regole tra più campi ----------------------------------------------------

function resolveRules(options: RequestRuleOptions) {
  return {
    minLeadHours: options.minLeadHours ?? DEFAULT_REQUEST_RULES.minLeadHours,
    maxRentalDays: options.maxRentalDays ?? DEFAULT_REQUEST_RULES.maxRentalDays,
    now: () => options.now ?? new Date(),
  };
}

/**
 * Date e indirizzi. Gira anche se altri campi sono già sbagliati, così il
 * cliente vede tutti gli errori insieme: i valori vanno quindi controllati.
 */
function rentalRules(options: RequestRuleOptions) {
  const rules = resolveRules(options);

  return (data: Record<string, unknown>, ctx: z.RefinementCtx) => {
    const { pickupAt, returnAt } = data;

    if (pickupAt instanceof Date) {
      const leadMs = pickupAt.getTime() - rules.now().getTime();
      if (leadMs < rules.minLeadHours * HOUR_MS) {
        ctx.addIssue({
          code: "custom",
          path: ["pickupAt"],
          message: "pickupTooSoon",
          params: { hours: rules.minLeadHours },
        });
      }

      if (returnAt instanceof Date) {
        const hours = romeClockHoursBetween(pickupAt, returnAt);
        if (returnAt.getTime() <= pickupAt.getTime()) {
          ctx.addIssue({
            code: "custom",
            path: ["returnAt"],
            message: "returnBeforePickup",
          });
        } else if (hours < MIN_RENTAL_HOURS) {
          ctx.addIssue({
            code: "custom",
            path: ["returnAt"],
            message: "durationTooShort",
          });
        } else if (hours > rules.maxRentalDays * 24) {
          ctx.addIssue({
            code: "custom",
            path: ["returnAt"],
            message: "durationTooLong",
            params: { days: rules.maxRentalDays },
          });
        }
      }
    }

    for (const [location, address] of [
      ["pickupLocation", "pickupAddress"],
      ["returnLocation", "returnAddress"],
    ] as const) {
      const value = data[address];
      const missing = typeof value !== "string" || value.trim() === "";
      if (LOCATIONS_WITH_ADDRESS.has(data[location]) && missing) {
        ctx.addIssue({
          code: "custom",
          path: [address],
          message: "addressRequired",
        });
      }
    }
  };
}

const runOnObjects = {
  when: (payload: { value: unknown }) =>
    typeof payload.value === "object" && payload.value !== null,
};

// --- Schemi ------------------------------------------------------------------

/** Passo 1 del modulo: auto, date, luoghi, km, extra, note. */
export function createRentalSchema(options: RequestRuleOptions = {}) {
  return z
    .object(rentalShape, { error: "invalid" })
    .superRefine(rentalRules(options), runOnObjects);
}

/** Passo 2 del modulo: recapiti e consensi. */
export const contactSchema = z.object(contactShape, { error: "invalid" });

/** Richiesta completa, come la riceve il server. */
export function createBookingRequestSchema(options: RequestRuleOptions = {}) {
  return z
    .object({ ...rentalShape, ...contactShape }, { error: "invalid" })
    .superRefine(rentalRules(options), runOnObjects);
}

export type RentalDetails = z.output<ReturnType<typeof createRentalSchema>>;
export type ContactDetails = z.output<typeof contactSchema>;
export type BookingRequest = z.output<
  ReturnType<typeof createBookingRequestSchema>
>;

// --- Errori per campo --------------------------------------------------------

export type RequestField = keyof BookingRequest;

export type RequestFieldError = {
  code: RequestErrorCode;
  /** Valori per il testo del messaggio, es. `{ hours: 24 }`. */
  values?: Record<string, number>;
};

/** Primo errore di ogni campo; `form` per un input che non è un oggetto. */
export type RequestFieldErrors = Partial<
  Record<RequestField | "form", RequestFieldError>
>;

export type ValidationResult<T> =
  { success: true; data: T } | { success: false; errors: RequestFieldErrors };

const ERROR_CODES: ReadonlySet<string> = new Set(REQUEST_ERROR_CODES);

function toFieldError(issue: z.core.$ZodIssue): RequestFieldError {
  const code = ERROR_CODES.has(issue.message)
    ? (issue.message as RequestErrorCode)
    : "invalid";

  if (code === "tooLong" && issue.code === "too_big") {
    return { code, values: { max: Number(issue.maximum) } };
  }
  if (issue.code === "custom" && issue.params) {
    return { code, values: issue.params as Record<string, number> };
  }
  return { code };
}

function toFieldErrors(error: z.ZodError): RequestFieldErrors {
  const errors: RequestFieldErrors = {};
  for (const issue of error.issues) {
    const [first] = issue.path;
    const field = (
      typeof first === "string" ? first : "form"
    ) as keyof RequestFieldErrors;
    errors[field] ??= toFieldError(issue);
  }
  return errors;
}

function validate<T>(
  schema: z.ZodType<T>,
  input: unknown,
): ValidationResult<T> {
  const result = schema.safeParse(input);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, errors: toFieldErrors(result.error) };
}

export function validateBookingRequest(
  input: unknown,
  options: RequestRuleOptions = {},
): ValidationResult<BookingRequest> {
  return validate(createBookingRequestSchema(options), input);
}

export function validateRentalStep(
  input: unknown,
  options: RequestRuleOptions = {},
): ValidationResult<RentalDetails> {
  return validate(createRentalSchema(options), input);
}

export function validateContactStep(
  input: unknown,
): ValidationResult<ContactDetails> {
  return validate(contactSchema, input);
}
