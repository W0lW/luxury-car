import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Risolve l'alias "@/..." di tsconfig.json.
    tsconfigPaths: true,
  },
  test: {
    // Solo i test unitari del codice: i test end-to-end stanno in e2e/ (Playwright)
    // e .claude/ contiene file di skill che non vanno eseguiti.
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
