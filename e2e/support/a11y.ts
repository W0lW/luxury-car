import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Livelli di gravità di axe che fanno fallire il test. */
const BLOCKING_IMPACTS: ReadonlySet<string> = new Set(["serious", "critical"]);

/**
 * Analizza la pagina con axe e fallisce se trova violazioni "serious" o "critical".
 * Le violazioni "minor" e "moderate" non bloccano.
 */
export async function expectNoA11yViolations(page: Page): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).analyze();

  const blocking = violations
    .filter(
      (violation) => violation.impact && BLOCKING_IMPACTS.has(violation.impact),
    )
    .map((violation) => {
      const targets = violation.nodes
        .map((node) => node.target.join(" "))
        .join(", ");
      return `${violation.id} [${violation.impact}] ${violation.help} -> ${targets}`;
    });

  expect(blocking, `Violazioni di accessibilità su ${page.url()}`).toEqual([]);
}
