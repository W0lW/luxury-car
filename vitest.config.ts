import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Risolve l'alias "@/..." di tsconfig.json.
    tsconfigPaths: true,
  },
  test: {
    // Solo i test unitari del codice e degli script di controllo: i test end-to-end
    // stanno in e2e/ (Playwright); .claude/ e scripts/ralph/ non vanno eseguiti.
    include: ["src/**/*.test.{ts,tsx}", "scripts/*.test.ts"],
    environment: "node",
  },
});
