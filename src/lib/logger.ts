// Log strutturati (una riga JSON per evento) senza dati personali né segreti.
// Su Cloudflare le righe finiscono in Workers Logs (observability in wrangler.jsonc),
// che riconosce il JSON e rende i campi interrogabili.

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogContext = Record<string, unknown>;

export interface Logger {
  debug(msg: string, context?: LogContext): void;
  info(msg: string, context?: LogContext): void;
  warn(msg: string, context?: LogContext): void;
  error(msg: string, context?: LogContext): void;
  /** Logger che aggiunge `bindings` (es. `{ module: "requests" }`) a ogni riga. */
  child(bindings: LogContext): Logger;
}

export interface LoggerOptions {
  /** Livello minimo scritto. Predefinito: `info`. */
  level?: LogLevel;
  bindings?: LogContext;
  now?: () => Date;
  write?: (level: LogLevel, line: string) => void;
}

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const CORE_FIELDS = new Set(["time", "level", "msg"]);

function writeToConsole(level: LogLevel, line: string) {
  console[level](line);
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const {
    level = "info",
    bindings = {},
    now = () => new Date(),
    write = writeToConsole,
  } = options;
  const threshold = LEVELS[level];

  function log(entryLevel: LogLevel, msg: string, context: LogContext = {}) {
    if (LEVELS[entryLevel] < threshold) return;

    const fields = redact({ ...bindings, ...context }) as LogContext;
    const entry: LogContext = {
      time: now().toISOString(),
      level: entryLevel,
      msg: redactText(msg),
    };
    for (const [key, value] of Object.entries(fields)) {
      if (!CORE_FIELDS.has(key)) entry[key] = value;
    }
    write(entryLevel, JSON.stringify(entry));
  }

  return {
    debug: (msg, context) => log("debug", msg, context),
    info: (msg, context) => log("info", msg, context),
    warn: (msg, context) => log("warn", msg, context),
    error: (msg, context) => log("error", msg, context),
    child: (extra) =>
      createLogger({ level, now, write, bindings: { ...bindings, ...extra } }),
  };
}

/** Logger dell'applicazione. Nei moduli: `logger.child({ module: "requests" })`. */
export const logger = createLogger();

// --- Rimozione di dati personali e segreti --------------------------------

const REDACTED = "[redacted]";
const MAX_DEPTH = 8;

const EMAIL = /[\w.%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/gi;

// Sequenze di 9-15 cifre con spazi, punti, trattini o parentesi, con prefisso
// internazionale facoltativo (+39, 0039). Le date ISO non sono prese: la ricerca
// non parte da `aaaa-mm-gg` né subito dopo una cifra, un punto o un trattino.
const PHONE_CANDIDATE =
  /(?<![\w+.-])(?!\d{4}-\d{2}-\d{2})(?:\+|\(\+?)?\d[\d ().-]{6,}\d(?!\w)/g;

const TEXT_RULES: [RegExp, string][] = [
  // Intestazioni Cookie e Set-Cookie scritte nel testo: via tutto il valore.
  [/\b(set-cookie|cookie)\s*:[^\n]*/gi, `$1: ${REDACTED}`],
  [/\b(Bearer|Basic)\s+[\w.~+/=-]+/gi, "$1 [token]"],
  // JWT (sessioni Supabase, token firmati)
  [/\beyJ[\w-]+\.[\w-]+\.[\w-]*/g, "[token]"],
  // Chiavi con prefisso noto: Stripe, webhook Stripe, Supabase, Resend, Sentry, GitHub
  [
    /\b(?:(?:sk|rk|pk)_(?:live|test)_\w+|whsec_\w+|sb_secret_\w+|sbp_\w+|re_[A-Za-z0-9]{8,}\w*|sntry[su]_[\w=]+|gh[pousr]_\w+|github_pat_\w+)/g,
    "[token]",
  ],
  // Parametri delle URL con token, chiavi, firme, codici
  [
    /([?&](?:[\w-]*(?:token|secret|password|key|signature|sig|code)))=[^&\s#]*/gi,
    `$1=${REDACTED}`,
  ],
  [EMAIL, "[email]"],
];

function redactPhones(text: string): string {
  return text.replace(PHONE_CANDIDATE, (match) => {
    const digits = match.replace(/\D/g, "").length;
    return digits >= 9 && digits <= 15 ? "[phone]" : match;
  });
}

function redactText(text: string): string {
  let result = text;
  for (const [pattern, replacement] of TEXT_RULES) {
    result = result.replace(pattern, replacement);
  }
  return redactPhones(result);
}

const SENSITIVE_KEYS = new Set([
  "telefono",
  "tel",
  "cellulare",
  "auth",
  "pwd",
  "passwd",
]);
const SENSITIVE_KEY_ENDINGS = [
  "email",
  "phone",
  "token",
  "password",
  "secret",
  "cookie",
  "cookies",
  "apikey",
  "signature",
  "authorization",
];

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
  return (
    SENSITIVE_KEYS.has(normalized) ||
    SENSITIVE_KEY_ENDINGS.some((ending) => normalized.endsWith(ending))
  );
}

function redactError(error: Error, ancestors: Set<object>, depth: number) {
  const result: LogContext = {
    name: error.name,
    message: redactText(error.message),
  };
  if (error.stack) result.stack = redactText(error.stack);
  // Campi aggiunti all'errore (code, digest, status, ...)
  Object.assign(
    result,
    redactValue({ ...error }, ancestors, depth) as LogContext,
  );
  if (error.cause !== undefined) {
    result.cause = redactValue(error.cause, ancestors, depth + 1);
  }
  return result;
}

function redactValue(
  value: unknown,
  ancestors: Set<object>,
  depth: number,
): unknown {
  if (typeof value === "string") return redactText(value);
  if (typeof value === "bigint") return value.toString();
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return value.toISOString();
  if (depth > MAX_DEPTH) return "[truncated]";
  if (ancestors.has(value)) return "[circular]";

  ancestors.add(value);
  try {
    if (value instanceof Error) return redactError(value, ancestors, depth);
    if (Array.isArray(value)) {
      return value.map((item) => redactValue(item, ancestors, depth + 1));
    }
    const entries =
      value instanceof Map ||
      (typeof Headers !== "undefined" && value instanceof Headers)
        ? Array.from(value.entries())
        : Object.entries(value);
    const result: LogContext = {};
    for (const [key, item] of entries) {
      result[String(key)] = isSensitiveKey(String(key))
        ? REDACTED
        : redactValue(item, ancestors, depth + 1);
    }
    return result;
  } finally {
    ancestors.delete(value);
  }
}

/**
 * Copia di `value` senza email, telefoni, token, cookie e segreti: i campi con nome
 * sensibile (email, phone, token, password, secret, cookie, authorization, ...)
 * diventano `[redacted]`, il resto del testo viene ripulito. Usata dal logger e
 * dagli eventi inviati a Sentry.
 */
export function redact(value: unknown): unknown {
  return redactValue(value, new Set(), 0);
}
