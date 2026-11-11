import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Ultimo: spegne le regole di stile che si scontrano con Prettier.
  prettier,
  globalIgnores([
    // Generati
    ".next/**",
    "out/**",
    "build/**",
    ".open-next/**",
    ".wrangler/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
    "cloudflare-env.d.ts",
    // Non fanno parte dell'applicazione
    ".claude/**",
    "scripts/ralph/**",
  ]),
]);

export default eslintConfig;
