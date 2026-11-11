import { expect, test } from "@playwright/test";

import { expectNoA11yViolations } from "./support/a11y";

test("la home si apre con il titolo del sito", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/VELOCI PRIVATE/);
});

test("la home non ha violazioni di accessibilità gravi", async ({ page }) => {
  await page.goto("/");

  await expectNoA11yViolations(page);
});
