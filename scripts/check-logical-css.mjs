// Controllo del CSS logico (`npm run check:logical-css`, eseguito anche da `npm run lint` e in CI).
//
// Fallisce se in src/ (o nei percorsi passati come argomenti) trova classi Tailwind fisiche
// (ml-, pr-, left-, text-right, border-l, rounded-r, float-left, ...) o proprietà CSS fisiche
// (margin-left, left:, text-align: right, marginLeft negli oggetti style, ...).
// Per ogni caso stampa file:riga:colonna e l'alternativa logica. Regole in scripts/logical-css.mjs.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

import { findPhysicalCss } from "./logical-css.mjs";

const EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
]);

/** @param {string} path */
function listFiles(path) {
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path, { recursive: true, encoding: "utf8" })
    .filter((entry) => !entry.split(/[\\/]/).includes("node_modules"))
    .map((entry) => join(path, entry))
    .filter((file) => EXTENSIONS.has(extname(file)) && statSync(file).isFile());
}

const roots = process.argv.slice(2);
const files = (roots.length > 0 ? roots : ["src"]).flatMap(listFiles).sort();

let total = 0;
for (const file of files) {
  const name = relative(process.cwd(), file).replaceAll("\\", "/");
  for (const { line, column, found, suggestion } of findPhysicalCss(
    readFileSync(file, "utf8"),
    file,
  )) {
    console.error(`${name}:${line}:${column}  ${found}  ->  usa ${suggestion}`);
    total += 1;
  }
}

if (total > 0) {
  console.error(
    `\nCSS logico: ${total} ${total === 1 ? "proprietà fisica trovata" : "proprietà fisiche trovate"}. ` +
      "Usa le proprietà logiche (ms-/me-, ps-/pe-, inset-s-/inset-e-, text-start/end, ...) " +
      "e DirectionalIcon per frecce e chevron.",
  );
  process.exitCode = 1;
} else {
  console.log(`CSS logico: nessuna proprietà fisica in ${files.length} file.`);
}
