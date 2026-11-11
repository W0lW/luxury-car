import { expect, test } from "@playwright/test";

import { expectNoA11yViolations } from "./support/a11y";

// Verifica l'helper su HTML scritto a mano, senza passare dal sito.
const html = (body: string) =>
  `<!doctype html><html lang="it"><head><title>Prova</title></head><body>${body}</body></html>`;

test.describe("expectNoA11yViolations", () => {
  test("fallisce su una violazione critical (immagine senza alt)", async ({
    page,
  }) => {
    await page.setContent(
      html('<main><h1>Prova</h1><img src="data:," /></main>'),
    );

    await expect(expectNoA11yViolations(page)).rejects.toThrow(
      /image-alt \[critical\]/,
    );
  });

  test("fallisce su una violazione serious (link senza testo)", async ({
    page,
  }) => {
    await page.setContent(
      html('<main><h1>Prova</h1><a href="/auto"></a></main>'),
    );

    await expect(expectNoA11yViolations(page)).rejects.toThrow(
      /link-name \[serious\]/,
    );
  });

  test("non fallisce sulle violazioni moderate (manca il titolo h1)", async ({
    page,
  }) => {
    await page.setContent(html("<main><p>Solo testo</p></main>"));

    await expectNoA11yViolations(page);
  });
});
