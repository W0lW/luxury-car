// Dimensione del Worker rispetto ai limiti di Cloudflare (`npm run check:worker-size`).
//
// Prerequisito: `npx opennextjs-cloudflare build` (o `npm run preview`), che crea .open-next/.
// Lo script fa il bundle come in un deploy (`wrangler deploy --dry-run`, nessun caricamento),
// poi misura i file del Worker (le risorse statiche in .open-next/assets non contano).
//
// Limiti verificati l'11/11/2026 su https://developers.cloudflare.com/workers/platform/limits/
// (pagina aggiornata il 29/10/2026): "Worker size (uncompressed)" 64 MiB sia su Free sia su Paid;
// "There is no compressed size limit": la dimensione compressa si stampa solo come riferimento.
// Il limite che resta diverso tra i piani e pesa su Next.js è il tempo CPU (Free 10 ms, Paid 5 min).

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const MiB = 1024 * 1024;

const LIMITS = {
  checkedOn: "2026-11-11",
  source: "https://developers.cloudflare.com/workers/platform/limits/",
  plans: [
    {
      name: "Workers Free",
      uncompressedBytes: 64 * MiB,
      compressedBytes: null,
    },
    {
      name: "Workers Paid",
      uncompressedBytes: 64 * MiB,
      compressedBytes: null,
    },
  ],
};

const env = process.argv
  .find((arg) => arg.startsWith("--env="))
  ?.slice("--env=".length);

if (!existsSync(".open-next/worker.js")) {
  console.error(
    "Manca .open-next/worker.js: eseguire prima `npx opennextjs-cloudflare build`.",
  );
  process.exit(1);
}

const outdir = mkdtempSync(join(tmpdir(), "veloci-worker-size-"));

try {
  // Wrangler del progetto avviato con Node, senza shell: nessun problema di quoting su Windows.
  // Senza --env si misura il Worker in alto in wrangler.jsonc (`--env=` evita l'avviso di Wrangler).
  const wranglerBin = join("node_modules", "wrangler", "bin", "wrangler.js");
  const wranglerOutput = execFileSync(
    process.execPath,
    [
      wranglerBin,
      "deploy",
      "--dry-run",
      "--outdir",
      outdir,
      `--env=${env ?? ""}`,
    ],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
      // Evita che `wrangler deploy` richiami `opennextjs-cloudflare deploy` (vedi OpenNext).
      env: { ...process.env, OPEN_NEXT_DEPLOY: "true" },
    },
  );
  const wranglerTotal = wranglerOutput.match(/Total Upload:.*/)?.[0];

  const files = listFiles(outdir).filter(
    (file) => !file.endsWith(".map") && !file.endsWith("README.md"),
  );
  let uncompressed = 0;
  let compressed = 0;
  for (const file of files) {
    const content = readFileSync(file);
    uncompressed += content.byteLength;
    compressed += gzipSync(content, { level: 9 }).byteLength;
  }

  console.log(`Worker${env ? ` (ambiente ${env})` : ""}: ${files.length} file`);
  console.log(`  Non compresso: ${formatBytes(uncompressed)}`);
  console.log(`  Compresso (gzip): ${formatBytes(compressed)}`);
  if (wranglerTotal) console.log(`  Riferimento di Wrangler: ${wranglerTotal}`);
  console.log(`\nLimiti verificati il ${LIMITS.checkedOn} (${LIMITS.source}):`);

  let fits = true;
  for (const plan of LIMITS.plans) {
    const okUncompressed = uncompressed <= plan.uncompressedBytes;
    const okCompressed =
      plan.compressedBytes === null || compressed <= plan.compressedBytes;
    fits &&= okUncompressed && okCompressed;
    const compressedLimit =
      plan.compressedBytes === null
        ? "nessun limite"
        : formatBytes(plan.compressedBytes);
    console.log(
      `  ${plan.name}: non compresso ${formatBytes(uncompressed)} / ${formatBytes(plan.uncompressedBytes)} ` +
        `(${percent(uncompressed, plan.uncompressedBytes)}), compresso: ${compressedLimit} -> ` +
        (okUncompressed && okCompressed ? "OK" : "OLTRE IL LIMITE"),
    );
  }

  process.exitCode = fits ? 0 : 1;
} finally {
  rmSync(outdir, { recursive: true, force: true });
}

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(entry.parentPath ?? dir, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

function formatBytes(bytes) {
  return bytes >= MiB
    ? `${(bytes / MiB).toFixed(2)} MiB`
    : `${(bytes / 1024).toFixed(1)} KiB`;
}

function percent(value, limit) {
  return `${((value / limit) * 100).toFixed(1)}%`;
}
