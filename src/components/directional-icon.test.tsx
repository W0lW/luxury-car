import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DirectionalIcon } from "./directional-icon";

const shapes = ["arrow", "chevron"] as const;
const directions = ["forward", "back"] as const;

describe("DirectionalIcon", () => {
  it.each(
    shapes.flatMap((shape) =>
      directions.map((direction) => [shape, direction] as const),
    ),
  )("%s %s: decorativa e specchiata con dir=rtl", (shape, direction) => {
    const html = renderToStaticMarkup(
      <DirectionalIcon shape={shape} direction={direction} />,
    );
    expect(html).toMatch(/^<svg /);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('focusable="false"');
    expect(html).toContain('stroke="currentColor"');
    expect(html).toMatch(/class="[^"]*\brtl:-scale-x-100\b/);
  });

  it.each(shapes)("%s: forward e back puntano in versi opposti", (shape) => {
    const forward = renderToStaticMarkup(
      <DirectionalIcon shape={shape} direction="forward" />,
    );
    const back = renderToStaticMarkup(
      <DirectionalIcon shape={shape} direction="back" />,
    );
    expect(forward).not.toEqual(back);
  });

  it("aggiunge le classi passate", () => {
    const html = renderToStaticMarkup(
      <DirectionalIcon
        shape="chevron"
        direction="forward"
        className="size-4"
      />,
    );
    expect(html).toMatch(/class="[^"]*\brtl:-scale-x-100\b[^"]*\bsize-4\b/);
  });
});
