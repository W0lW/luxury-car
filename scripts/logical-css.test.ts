import { describe, expect, it } from "vitest";

import { findPhysicalCss } from "./logical-css.mjs";

const inTsx = (source: string) => findPhysicalCss(source, "x.tsx");
const inCss = (source: string) => findPhysicalCss(source, "x.css");
const found = (source: string, file = "x.tsx") =>
  findPhysicalCss(source, file).map((f) => f.found);

describe("classi Tailwind fisiche", () => {
  it.each([
    ["ml-4", "ms-4"],
    ["mr-auto", "me-auto"],
    ["pl-2", "ps-2"],
    ["pr-[3px]", "pe-[3px]"],
    ["left-0", "inset-s-0"],
    ["right-1/2", "inset-e-1/2"],
    ["text-left", "text-start"],
    ["text-right", "text-end"],
    ["border-l", "border-s"],
    ["border-r-2", "border-e-2"],
    ["rounded-l-lg", "rounded-s-lg"],
    ["rounded-r", "rounded-e"],
    ["float-left", "float-start"],
    ["float-right", "float-end"],
    ["rounded-tl-md", "rounded-ss-md"],
    ["rounded-tr", "rounded-se"],
    ["rounded-bl-xl", "rounded-es-xl"],
    ["rounded-br", "rounded-ee"],
    ["scroll-ml-4", "scroll-ms-4"],
    ["scroll-pr-2", "scroll-pe-2"],
    ["clear-left", "clear-start"],
    ["ml-(--gap)", "ms-(--gap)"],
  ])("%s → %s", (cls, suggestion) => {
    expect(inTsx(`<div className="flex ${cls} gap-2" />`)).toEqual([
      { line: 1, column: 22, found: cls, suggestion },
    ]);
  });

  it.each([
    ["md:ml-4", "md:ms-4"],
    ["-ml-2", "-ms-2"],
    ["hover:-left-1", "hover:-inset-s-1"],
    ["!pl-2", "!ps-2"],
    ["pl-2!", "ps-2!"],
    ["[&>svg]:mr-1", "[&>svg]:me-1"],
    ["data-[side=left]:ml-2", "data-[side=left]:ms-2"],
    ["group-hover:text-right", "group-hover:text-end"],
    ["ml-[calc(100%-1px)]", "ms-[calc(100%-1px)]"],
  ])("con varianti e modificatori: %s → %s", (cls, suggestion) => {
    const [finding] = inTsx(`cn("${cls}")`);
    expect(finding).toMatchObject({ found: cls, suggestion });
  });

  it("trova le classi in stringhe, template e @apply", () => {
    expect(found("const a = 'pl-4';")).toEqual(["pl-4"]);
    expect(found("const b = `p-2 ${x ? 'mr-2' : ''}`;")).toEqual(["mr-2"]);
    expect(found(".btn {\n  @apply ml-4 px-2;\n}", "x.css")).toEqual(["ml-4"]);
  });

  it("non segnala le classi logiche o simmetriche", () => {
    const logical = [
      "ms-4 me-auto ps-2 pe-2 start-0 end-0 inset-s-0 inset-e-2 -ms-2",
      "text-start text-end border-s border-e-2 rounded-s-lg rounded-e",
      "rounded-ss rounded-ee float-start clear-end scroll-ms-4 scroll-pe-2",
      "px-4 mx-auto inset-x-0 text-center border-t rounded-t-lg rounded-lg",
      "border-lime-500 space-x-4 scroll-mt-4 justify-start md:ms-4",
    ].join(" ");
    expect(inTsx(`<div className="${logical}" />`)).toEqual([]);
  });

  it("non segnala parole che contengono left o right", () => {
    expect(
      inTsx(
        'const k = { name: "chevron-left", t: "Left", l: "pl-PL", u: "https://x.it/ml-4" };',
      ),
    ).toEqual([]);
  });
});

describe("proprietà CSS fisiche nei file .css", () => {
  it.each([
    ["margin-left: 0;", "margin-left", "margin-inline-start"],
    ["padding-right:1rem;", "padding-right", "padding-inline-end"],
    [
      "scroll-margin-left: 4px;",
      "scroll-margin-left",
      "scroll-margin-inline-start",
    ],
    ["left: 0;", "left", "inset-inline-start"],
    ["right:0;", "right", "inset-inline-end"],
    ["text-align: left;", "text-align: left", "text-align: start"],
    ["float: right;", "float: right", "float: inline-end"],
    ["clear: left;", "clear: left", "clear: inline-start"],
    ["border-left: 1px solid;", "border-left", "border-inline-start"],
    [
      "border-right-color: red;",
      "border-right-color",
      "border-inline-end-color",
    ],
    [
      "border-top-left-radius: 4px;",
      "border-top-left-radius",
      "border-start-start-radius",
    ],
    [
      "border-bottom-right-radius: 4px;",
      "border-bottom-right-radius",
      "border-end-end-radius",
    ],
  ])("%s", (declaration, property, suggestion) => {
    expect(inCss(`.a {\n  ${declaration}\n}`)).toEqual([
      { line: 2, column: 3, found: property, suggestion },
    ]);
  });

  it("non segnala le proprietà logiche", () => {
    const css = [
      ".a {",
      "  margin-inline-start: 0;",
      "  inset-inline-end: 0;",
      "  text-align: start;",
      "  float: inline-start;",
      "  border-inline-start: 1px solid;",
      "  border-start-end-radius: 4px;",
      "  background-position: left;",
      "}",
      "@page :left { margin: 1cm; }",
    ].join("\n");
    expect(inCss(css)).toEqual([]);
  });
});

describe("proprietà fisiche nel codice TS/TSX", () => {
  it("proprietà arbitrarie di Tailwind", () => {
    expect(
      found('<div className="[margin-left:4px] [left:var(--x)]" />'),
    ).toEqual(["margin-left", "left"]);
  });

  it("oggetti style", () => {
    expect(
      found(
        "<div style={{ marginLeft: 8, paddingRight: 4, borderLeftWidth: 1, borderTopRightRadius: 2 }} />",
      ),
    ).toEqual([
      "marginLeft",
      "paddingRight",
      "borderLeftWidth",
      "borderTopRightRadius",
    ]);
    expect(
      found('<p style={{ textAlign: "right", float: "left" }} />'),
    ).toEqual(['textAlign: "right"', 'float: "left"']);
    expect(found('<i style={{ left: 0, right: "1rem" }} />')).toEqual([
      "left",
      "right",
    ]);
    expect(inTsx("const s = { marginLeft: 8 };")[0]).toMatchObject({
      suggestion: "marginInlineStart",
    });
  });

  it("non segnala ternari, chiavi tra virgolette e proprietà logiche", () => {
    const source = [
      "const side = isOpen ? left : 0;",
      'switch (x) { case "left": break; }',
      "const s = { marginInlineStart: 8, insetInlineEnd: 0, textAlign: 'start' };",
    ].join("\n");
    expect(inTsx(source)).toEqual([]);
  });
});

describe("commenti", () => {
  it("ignora i commenti, ma non le stringhe che contengono //", () => {
    const source = [
      "// non usare ml-4: si usa ms-4",
      "/* margin-left: 0 e text-left */",
      '<div>{/* pr-2 */}<a href="https://example.com" className="pl-2" /></div>',
    ].join("\n");
    expect(inTsx(source)).toEqual([
      { line: 3, column: 59, found: "pl-2", suggestion: "ps-2" },
    ]);
  });

  it("nei CSS ignora solo i commenti a blocco", () => {
    const css =
      '/* margin-left: 0 */\n.a { background: url("//cdn.example/x.png"); margin-right: 0; }';
    expect(found(css, "x.css")).toEqual(["margin-right"]);
  });

  it("riga e colonna restano corrette dopo un commento su più righe", () => {
    const source = "/*\n ml-4\n*/\nconst a = 'mr-4';";
    expect(inTsx(source)).toEqual([
      { line: 4, column: 12, found: "mr-4", suggestion: "me-4" },
    ]);
  });
});

it("più violazioni nella stessa riga, in ordine di posizione", () => {
  expect(found('<div className="ml-2 text-right border-l" />')).toEqual([
    "ml-2",
    "text-right",
    "border-l",
  ]);
});
