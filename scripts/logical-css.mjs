// Ricerca di classi Tailwind e proprietà CSS fisiche (left/right) in un file sorgente.
// La usa `scripts/check-logical-css.mjs` (`npm run check:logical-css`, dentro `npm run lint`):
// il layout deve usare solo proprietà logiche, così l'arabo (Fase 2, dir="rtl") non richiede
// di rifare il CSS. Frecce e chevron si specchiano con `DirectionalIcon` (src/components).

/**
 * @typedef {object} Finding
 * @property {number} line Riga, da 1.
 * @property {number} column Colonna, da 1.
 * @property {string} found Testo trovato (classe con varianti, proprietà o dichiarazione).
 * @property {string} suggestion Alternativa logica.
 */

// Classi Tailwind: prefisso fisico -> prefisso logico (Tailwind 4.3).
const TAILWIND_PREFIXES = {
  "scroll-ml": "scroll-ms",
  "scroll-mr": "scroll-me",
  "scroll-pl": "scroll-ps",
  "scroll-pr": "scroll-pe",
  ml: "ms",
  mr: "me",
  pl: "ps",
  pr: "pe",
  left: "inset-s",
  right: "inset-e",
};
// Valide anche da sole (`border-l`, `rounded-r`) o con un valore (`border-l-2`).
const TAILWIND_STANDALONE = {
  "border-l": "border-s",
  "border-r": "border-e",
  "rounded-l": "rounded-s",
  "rounded-r": "rounded-e",
  "rounded-tl": "rounded-ss",
  "rounded-tr": "rounded-se",
  "rounded-bl": "rounded-es",
  "rounded-br": "rounded-ee",
};
const TAILWIND_EXACT = {
  "text-left": "text-start",
  "text-right": "text-end",
  "float-left": "float-start",
  "float-right": "float-end",
  "clear-left": "clear-start",
  "clear-right": "clear-end",
};

const alternation = (keys) =>
  [...keys].sort((a, b) => b.length - a.length).join("|");

// Il valore dopo il prefisso è minuscolo, un numero, `[...]` o `(...)`: così `pl-PL` non conta.
const PREFIX_RE = new RegExp(
  `^(${alternation(Object.keys(TAILWIND_PREFIXES))})-([a-z0-9[(].*)?$`,
);
const STANDALONE_RE = new RegExp(
  `^(${alternation(Object.keys(TAILWIND_STANDALONE))})(-[a-z0-9[(].*)?$`,
);

// Proprietà CSS fisiche (file .css e proprietà arbitrarie di Tailwind come `[margin-left:4px]`).
const CSS_PROPERTY_RE =
  /(?<![\w-])((?:scroll-)?(?:margin|padding)-(?:left|right)|border-(?:left|right)(?:-(?:width|style|color))?|border-(?:top|bottom)-(?:left|right)-radius)\s*:/g;
const CSS_VALUE_RE =
  /(?<![\w-])(text-align|float|clear)(\s*:\s*)(left|right)\b/g;
// `left:`/`right:` come proprietà: in un .css ovunque, nel codice solo come `[left:...]`.
const CSS_INSET_RE = /(?<![\w-])(left|right)\s*:/g;
const ARBITRARY_INSET_RE = /(?<=\[)(left|right)\s*:/g;

// Oggetti style di React (camelCase).
const JS_PROPERTY_RE =
  /(?<![\w$])((?:scrollMargin|scrollPadding|margin|padding|border)(?:Left|Right)\w*|border(?:Top|Bottom)(?:Left|Right)Radius)\b/g;
const JS_VALUE_RE =
  /(?<![\w$])(textAlign|float|cssFloat|clear)(\s*:\s*)(["'`])(left|right)\3/g;
// Chiave `left`/`right` con un valore letterale; esclusi ternari (`a ? left : 0`).
const JS_INSET_RE =
  /(?<![\w$.\-?])(?<!\?\s*)(left|right)\s*:\s*(?=["'`]|-?\.?\d)/g;

const LOGICAL_SIDE = { left: "start", right: "end" };
const LOGICAL_INSET = { left: "inset-inline-start", right: "inset-inline-end" };
const LOGICAL_CORNER = {
  "top-left": "start-start",
  "top-right": "start-end",
  "bottom-left": "end-start",
  "bottom-right": "end-end",
};

/** @param {string} property */
function logicalCssProperty(property) {
  const corner = property.match(/^border-(top|bottom)-(left|right)-radius$/);
  if (corner)
    return `border-${LOGICAL_CORNER[`${corner[1]}-${corner[2]}`]}-radius`;
  return property.replace(
    /-(left|right)/,
    (_, side) => `-inline-${LOGICAL_SIDE[side]}`,
  );
}

/** @param {string} property */
function logicalJsProperty(property) {
  const corner = property.match(/^border(Top|Bottom)(Left|Right)Radius$/);
  if (corner) {
    const [block, inline] =
      LOGICAL_CORNER[
        `${corner[1].toLowerCase()}-${corner[2].toLowerCase()}`
      ].split("-");
    return `border${capitalize(block)}${capitalize(inline)}Radius`;
  }
  return property.replace(
    /(Left|Right)/,
    (side) => `Inline${capitalize(LOGICAL_SIDE[side.toLowerCase()])}`,
  );
}

/** @param {string} word */
const capitalize = (word) => word[0].toUpperCase() + word.slice(1);

/**
 * Classe Tailwind fisica -> alternativa logica, oppure null.
 * Gestisce varianti (`md:`, `[&>svg]:`), `!` e valori negativi.
 * @param {string} token
 */
function logicalTailwindClass(token) {
  const lastColon = token.lastIndexOf(":");
  const variants = token.slice(0, lastColon + 1);
  // `!` (importante) prima o dopo, `-` per i valori negativi.
  const [, before, negative, core, after] = token
    .slice(lastColon + 1)
    .match(/^(!?)(-?)(.*?)(!?)$/);

  let logical = null;
  if (core in TAILWIND_EXACT) {
    logical = TAILWIND_EXACT[core];
  } else {
    const prefixed = core.match(PREFIX_RE);
    const standalone = core.match(STANDALONE_RE);
    if (prefixed)
      logical = `${TAILWIND_PREFIXES[prefixed[1]]}-${prefixed[2] ?? ""}`;
    else if (standalone)
      logical = `${TAILWIND_STANDALONE[standalone[1]]}${standalone[2] ?? ""}`;
  }
  return logical === null
    ? null
    : `${variants}${before}${negative}${logical}${after}`;
}

/**
 * Sostituisce i commenti con spazi (righe e colonne restano uguali).
 * @param {string} source
 * @param {boolean} lineComments `//` è un commento (JS/TS, non CSS).
 */
function blankComments(source, lineComments) {
  const blank = (text) => text.replace(/[^\r\n]/g, " ");
  let out = "";
  let quote = null;
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];
    if (quote) {
      if (ch === "\\") {
        out += source.slice(i, i + 2);
        i += 2;
        continue;
      }
      // Gli apici non chiusi (es. l'apostrofo in un testo JSX) finiscono a fine riga.
      if (ch === quote || (ch === "\n" && quote !== "`")) quote = null;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === "/" && (next === "*" || (lineComments && next === "/"))) {
      const end =
        next === "*" ? source.indexOf("*/", i + 2) : source.indexOf("\n", i);
      const stop = end === -1 ? source.length : next === "*" ? end + 2 : end;
      out += blank(source.slice(i, stop));
      i = stop;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") quote = ch;
    out += ch;
    i += 1;
  }
  return out;
}

/**
 * Trova classi Tailwind e proprietà CSS fisiche in un file.
 * @param {string} source Contenuto del file.
 * @param {string} filePath Percorso: decide se è CSS (`.css`) o codice JS/TS.
 * @returns {Finding[]} In ordine di posizione.
 */
export function findPhysicalCss(source, filePath) {
  const isCss = filePath.endsWith(".css");
  const text = blankComments(source, !isCss);
  /** @type {Map<number, {index: number, found: string, suggestion: string}>} */
  const byIndex = new Map();
  const add = (index, found, suggestion) => {
    if (!byIndex.has(index)) byIndex.set(index, { index, found, suggestion });
  };

  for (const match of text.matchAll(/[^\s"'`{},;]+/g)) {
    const suggestion = logicalTailwindClass(match[0]);
    if (suggestion !== null) add(match.index, match[0], suggestion);
  }
  for (const match of text.matchAll(CSS_PROPERTY_RE)) {
    add(match.index, match[1], logicalCssProperty(match[1]));
  }
  for (const match of text.matchAll(CSS_VALUE_RE)) {
    const [, property, separator, side] = match;
    const value =
      property === "text-align"
        ? LOGICAL_SIDE[side]
        : `inline-${LOGICAL_SIDE[side]}`;
    add(match.index, match[0], `${property}${separator}${value}`);
  }
  for (const match of text.matchAll(
    isCss ? CSS_INSET_RE : ARBITRARY_INSET_RE,
  )) {
    add(match.index, match[1], LOGICAL_INSET[match[1]]);
  }
  if (!isCss) {
    for (const match of text.matchAll(JS_PROPERTY_RE)) {
      add(match.index, match[1], logicalJsProperty(match[1]));
    }
    for (const match of text.matchAll(JS_VALUE_RE)) {
      const [, property, separator, quote, side] = match;
      const value =
        property === "textAlign"
          ? LOGICAL_SIDE[side]
          : `inline-${LOGICAL_SIDE[side]}`;
      add(
        match.index,
        match[0],
        `${property}${separator}${quote}${value}${quote}`,
      );
    }
    for (const match of text.matchAll(JS_INSET_RE)) {
      const side = match[1];
      add(
        match.index,
        side,
        side === "left" ? "insetInlineStart" : "insetInlineEnd",
      );
    }
  }

  const lineStarts = [0];
  for (let i = 0; i < source.length; i += 1) {
    if (source[i] === "\n") lineStarts.push(i + 1);
  }
  return [...byIndex.values()]
    .sort((a, b) => a.index - b.index)
    .map(({ index, found, suggestion }) => {
      let line = lineStarts.length - 1;
      while (lineStarts[line] > index) line -= 1;
      return {
        line: line + 1,
        column: index - lineStarts[line] + 1,
        found,
        suggestion,
      };
    });
}
