import { describe, expect, it } from "vitest";

import en from "../../../messages/en.json";
import it_ from "../../../messages/it.json";
import { LOCATION_TYPES } from "@/modules/requests/schema";

import {
  PLACEHOLDERS,
  renderTemplate,
  validateTemplate,
  type MessageTemplate,
  type RenderResult,
  type TemplateContext,
} from "./template";

// Intl separa cifra e simbolo con uno spazio non divisibile (U+00A0).
const NBSP = " ";

/** Contesto completo: ogni segnaposto ha un valore. */
function makeContext(
  overrides: Partial<TemplateContext> = {},
): TemplateContext {
  return {
    locale: "it",
    contactName: "Mario Rossi",
    requestCode: "VP-2026-0042",
    vehicleName: "Lamborghini Urus",
    // 09:00 UTC = 10:00 a Roma; 17:30 UTC = 18:30 a Roma.
    pickupAt: new Date("2026-11-20T09:00:00Z"),
    returnAt: new Date("2026-11-23T17:30:00Z"),
    pickupLocation: { type: "airport_flr", address: null },
    quoteTotalCents: 6_250_000,
    depositCents: 1_250_000,
    balanceCents: 5_000_000,
    depositLinkUrl: "https://checkout.stripe.com/c/pay/cs_test_a1b2",
    depositLinkExpiresAt: new Date("2026-11-14T22:59:00Z"),
    operatorName: "Giulia Bianchi",
    companyPhoneE164: "+390551234567",
    ...overrides,
  };
}

function whatsapp(body: string): MessageTemplate {
  return { channel: "whatsapp", subject: null, body };
}

function email(subject: string, body: string): MessageTemplate {
  return { channel: "email", subject, body };
}

/** Testo per WhatsApp di un modello riuscito (fa fallire il test se non riesce). */
function renderText(body: string, context: TemplateContext): string {
  return expectRendered(renderTemplate(whatsapp(body), context)).text;
}

function renderHtml(body: string, context = makeContext()): string {
  return expectRendered(renderTemplate(whatsapp(body), context)).html;
}

function expectRendered(result: RenderResult) {
  if (!result.ok) {
    throw new Error(`Modello non compilato: ${JSON.stringify(result.errors)}`);
  }
  return result.message;
}

describe("PLACEHOLDERS", () => {
  it("elenca i 13 segnaposto del menu dell'editor", () => {
    expect([...PLACEHOLDERS].sort()).toEqual(
      [
        "nome",
        "codice",
        "auto",
        "data_ritiro",
        "data_riconsegna",
        "luogo",
        "prezzo_totale",
        "acconto",
        "saldo",
        "link_acconto",
        "scadenza_link",
        "operatore",
        "telefono_azienda",
      ].sort(),
    );
  });
});

describe("validateTemplate (salvataggio del modello)", () => {
  it("accetta un modello con tutti i segnaposto e li elenca una volta, in ordine", () => {
    const body = PLACEHOLDERS.map((name) => `{{${name}}}`).join("\n");
    const result = validateTemplate(email("Preventivo {{codice}}", body));
    expect(result).toEqual({
      ok: true,
      placeholders: [
        "codice",
        ...PLACEHOLDERS.filter((name) => name !== "codice"),
      ],
    });
  });

  it("accetta un modello senza segnaposto", () => {
    expect(validateTemplate(whatsapp("Grazie, a presto."))).toEqual({
      ok: true,
      placeholders: [],
    });
  });

  it("accetta gli spazi dentro le graffe", () => {
    expect(validateTemplate(whatsapp("Ciao {{ nome }}"))).toEqual({
      ok: true,
      placeholders: ["nome"],
    });
  });

  it("rifiuta un segnaposto sconosciuto nel testo", () => {
    expect(validateTemplate(whatsapp("Ciao {{cognome}}"))).toEqual({
      ok: false,
      errors: [{ code: "unknownPlaceholder", placeholder: "cognome" }],
    });
  });

  it("rifiuta un segnaposto sconosciuto nell'oggetto", () => {
    expect(
      validateTemplate(email("Offerta {{targa}}", "Ciao {{nome}}")),
    ).toEqual({
      ok: false,
      errors: [{ code: "unknownPlaceholder", placeholder: "targa" }],
    });
  });

  it("distingue maiuscole e minuscole", () => {
    expect(validateTemplate(whatsapp("Ciao {{Nome}}"))).toEqual({
      ok: false,
      errors: [{ code: "unknownPlaceholder", placeholder: "Nome" }],
    });
  });

  it("elenca ogni segnaposto sconosciuto una sola volta", () => {
    expect(
      validateTemplate(whatsapp("{{targa}} {{nome}} {{colore}} {{targa}}")),
    ).toEqual({
      ok: false,
      errors: [
        { code: "unknownPlaceholder", placeholder: "targa" },
        { code: "unknownPlaceholder", placeholder: "colore" },
      ],
    });
  });

  it.each([
    ["graffe non chiuse", "Ciao {{nome"],
    ["graffe non aperte", "Ciao nome}}"],
    ["graffe vuote", "Ciao {{}}"],
    ["graffe chiuse a metà", "Ciao {{nome}"],
  ])("rifiuta un segnaposto scritto male (%s)", (_case, body) => {
    expect(validateTemplate(whatsapp(body))).toEqual({
      ok: false,
      errors: [{ code: "malformedPlaceholder" }],
    });
  });
});

describe("renderTemplate: valori dei segnaposto", () => {
  it.each([
    ["nome", "Mario Rossi"],
    ["codice", "VP-2026-0042"],
    ["auto", "Lamborghini Urus"],
    ["data_ritiro", "venerdì 20 novembre 2026, ore 10:00"],
    ["data_riconsegna", "lunedì 23 novembre 2026, ore 18:30"],
    ["luogo", "Aeroporto di Firenze"],
    ["prezzo_totale", `62.500${NBSP}€`],
    ["acconto", `12.500${NBSP}€`],
    ["saldo", `50.000${NBSP}€`],
    ["link_acconto", "https://checkout.stripe.com/c/pay/cs_test_a1b2"],
    ["scadenza_link", "sabato 14 novembre 2026, ore 23:59"],
    ["operatore", "Giulia Bianchi"],
    ["telefono_azienda", "+39 055 123 4567"],
  ])("compila {{%s}} in italiano", (name, expected) => {
    expect(renderText(`[{{${name}}}]`, makeContext())).toBe(`[${expected}]`);
  });

  it.each([
    ["data_ritiro", "Friday 20 November 2026, 10:00"],
    ["data_riconsegna", "Monday 23 November 2026, 18:30"],
    ["luogo", "Florence Airport"],
    ["prezzo_totale", "€62,500"],
    ["acconto", "€12,500"],
    ["saldo", "€50,000"],
    ["scadenza_link", "Saturday 14 November 2026, 23:59"],
  ])("compila {{%s}} nella lingua del contatto (inglese)", (name, expected) => {
    expect(renderText(`[{{${name}}}]`, makeContext({ locale: "en" }))).toBe(
      `[${expected}]`,
    );
  });

  it("mostra i centesimi quando ci sono", () => {
    expect(
      renderText("{{saldo}}", makeContext({ balanceCents: 5_000_050 })),
    ).toBe(`50.000,50${NBSP}€`);
  });

  it("accetta un importo zero", () => {
    expect(renderText("{{acconto}}", makeContext({ depositCents: 0 }))).toBe(
      `0${NBSP}€`,
    );
  });

  it("nomina l'aeroporto di Pisa nelle due lingue", () => {
    const pickupLocation = { type: "airport_psa", address: null } as const;
    expect(renderText("{{luogo}}", makeContext({ pickupLocation }))).toBe(
      "Aeroporto di Pisa",
    );
    expect(
      renderText("{{luogo}}", makeContext({ locale: "en", pickupLocation })),
    ).toBe("Pisa Airport");
  });

  it.each(["hotel", "address", "other"] as const)(
    "per il luogo %s usa l'indirizzo scritto dal cliente",
    (type) => {
      const pickupLocation = { type, address: "  Piazza Ognissanti 1  " };
      expect(renderText("{{luogo}}", makeContext({ pickupLocation }))).toBe(
        "Piazza Ognissanti 1",
      );
    },
  );

  it("toglie gli spazi intorno ai testi", () => {
    expect(
      renderText("Ciao {{nome}}!", makeContext({ contactName: "  Mario  " })),
    ).toBe("Ciao Mario!");
  });

  it("compila lo stesso segnaposto ogni volta che compare", () => {
    expect(renderText("{{nome}} / {{ nome }}", makeContext())).toBe(
      "Mario Rossi / Mario Rossi",
    );
  });

  it("lascia com'è il resto del testo, graffe singole comprese", () => {
    expect(renderText("Totale {x}: {{prezzo_totale}}.", makeContext())).toBe(
      `Totale {x}: 62.500${NBSP}€.`,
    );
  });
});

describe("renderTemplate: valori mancanti (errore prima dell'invio)", () => {
  it("segnala un segnaposto senza valore", () => {
    expect(
      renderTemplate(
        whatsapp("Link: {{link_acconto}}"),
        makeContext({ depositLinkUrl: null }),
      ),
    ).toEqual({
      ok: false,
      errors: [{ code: "missingValue", placeholder: "link_acconto" }],
    });
  });

  it("elenca tutti i segnaposto senza valore, una volta ciascuno e in ordine", () => {
    expect(
      renderTemplate(
        email(
          "{{auto}} per {{nome}}",
          "{{nome}}: {{auto}} dal {{data_ritiro}}, totale {{prezzo_totale}}",
        ),
        makeContext({
          vehicleName: null,
          pickupAt: null,
          quoteTotalCents: null,
        }),
      ),
    ).toEqual({
      ok: false,
      errors: [
        { code: "missingValue", placeholder: "auto" },
        { code: "missingValue", placeholder: "data_ritiro" },
        { code: "missingValue", placeholder: "prezzo_totale" },
      ],
    });
  });

  it.each(["", "   "])("considera mancante un testo vuoto (%j)", (value) => {
    expect(
      renderTemplate(
        whatsapp("Ciao {{nome}}"),
        makeContext({ contactName: value }),
      ),
    ).toEqual({
      ok: false,
      errors: [{ code: "missingValue", placeholder: "nome" }],
    });
  });

  it("considera mancante il luogo senza indirizzo quando serve", () => {
    expect(
      renderTemplate(
        whatsapp("Consegna: {{luogo}}"),
        makeContext({ pickupLocation: { type: "hotel", address: " " } }),
      ),
    ).toEqual({
      ok: false,
      errors: [{ code: "missingValue", placeholder: "luogo" }],
    });
    expect(
      renderTemplate(
        whatsapp("Consegna: {{luogo}}"),
        makeContext({ pickupLocation: null }),
      ),
    ).toEqual({
      ok: false,
      errors: [{ code: "missingValue", placeholder: "luogo" }],
    });
  });

  it("chiede solo i valori dei segnaposto usati nel modello", () => {
    const result = renderTemplate(whatsapp("Ciao {{nome}}, a presto."), {
      locale: "it",
      contactName: "Mario",
    });
    expect(result.ok && result.message.text).toBe("Ciao Mario, a presto.");
  });

  it("non compila un modello con un segnaposto sconosciuto", () => {
    expect(
      renderTemplate(whatsapp("Ciao {{cognome}} {{nome}}"), makeContext()),
    ).toEqual({
      ok: false,
      errors: [{ code: "unknownPlaceholder", placeholder: "cognome" }],
    });
  });

  it("non compila un modello con un segnaposto scritto male", () => {
    expect(renderTemplate(whatsapp("Ciao {{nome"), makeContext())).toEqual({
      ok: false,
      errors: [{ code: "malformedPlaceholder" }],
    });
  });
});

describe("renderTemplate: valori non validi", () => {
  it.each([
    ["un link non https", "http://checkout.stripe.com/c/pay/cs_test"],
    ["un link javascript", "javascript:alert(1)"],
    ["un link che non è un indirizzo", "pagamento"],
  ])("rifiuta %s", (_case, depositLinkUrl) => {
    expect(
      renderTemplate(
        whatsapp("{{link_acconto}}"),
        makeContext({ depositLinkUrl }),
      ),
    ).toEqual({
      ok: false,
      errors: [{ code: "invalidValue", placeholder: "link_acconto" }],
    });
  });

  it.each([
    ["negativo", -100],
    ["con frazioni di centesimo", 10.5],
    ["non numerico", Number.NaN],
  ])("rifiuta un importo %s", (_case, balanceCents) => {
    expect(
      renderTemplate(whatsapp("{{saldo}}"), makeContext({ balanceCents })),
    ).toEqual({
      ok: false,
      errors: [{ code: "invalidValue", placeholder: "saldo" }],
    });
  });

  it("rifiuta una data non valida", () => {
    expect(
      renderTemplate(
        whatsapp("{{data_riconsegna}}"),
        makeContext({ returnAt: new Date("non una data") }),
      ),
    ).toEqual({
      ok: false,
      errors: [{ code: "invalidValue", placeholder: "data_riconsegna" }],
    });
  });

  it("rifiuta un telefono aziendale non valido", () => {
    expect(
      renderTemplate(
        whatsapp("{{telefono_azienda}}"),
        makeContext({ companyPhoneE164: "123" }),
      ),
    ).toEqual({
      ok: false,
      errors: [{ code: "invalidValue", placeholder: "telefono_azienda" }],
    });
  });
});

describe("renderTemplate: versione testo per WhatsApp", () => {
  it("non escapa i valori", () => {
    expect(
      renderText(
        "Ciao {{nome}}",
        makeContext({ contactName: `<b>Tom & "Jerry"</b>` }),
      ),
    ).toBe(`Ciao <b>Tom & "Jerry"</b>`);
  });

  it("usa a capo semplici anche se il modello arriva con CRLF", () => {
    expect(renderText("Ciao {{nome}},\r\n\r\na presto", makeContext())).toBe(
      "Ciao Mario Rossi,\n\na presto",
    );
  });
});

describe("renderTemplate: versione HTML per l'email", () => {
  it("escapa i valori inseriti dal cliente", () => {
    const html = renderHtml(
      "Ciao {{nome}}",
      makeContext({ contactName: `<script>alert("x")</script> & 'co'` }),
    );
    expect(html).toBe(
      "<p>Ciao &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;co&#39;</p>",
    );
    expect(html).not.toContain("<script");
  });

  it("escapa anche il testo del modello", () => {
    expect(renderHtml("Sconto < 10% & <b>gratis</b>")).toBe(
      "<p>Sconto &lt; 10% &amp; &lt;b&gt;gratis&lt;/b&gt;</p>",
    );
  });

  it("divide i paragrafi sulle righe vuote e va a capo con <br>", () => {
    expect(
      renderHtml("Ciao {{nome}},\r\n\r\nriga uno\r\nriga due\n\n\n\nSaluti"),
    ).toBe(
      "<p>Ciao Mario Rossi,</p>\n<p>riga uno<br>riga due</p>\n<p>Saluti</p>",
    );
  });

  it("ignora le righe vuote all'inizio e alla fine", () => {
    expect(renderHtml("\n\nCiao\n\n")).toBe("<p>Ciao</p>");
  });

  it("rende cliccabile il link dell'acconto, con l'indirizzo escapato", () => {
    const html = renderHtml(
      "Paga qui: {{link_acconto}}",
      makeContext({ depositLinkUrl: 'https://pay.example.com/c?a=1&b="2"' }),
    );
    expect(html).toBe(
      '<p>Paga qui: <a href="https://pay.example.com/c?a=1&amp;b=%222%22">https://pay.example.com/c?a=1&amp;b=%222%22</a></p>',
    );
  });

  it("lascia il link semplice nella versione testo", () => {
    expect(
      renderText(
        "{{link_acconto}}",
        makeContext({ depositLinkUrl: "https://pay.example.com/c?a=1&b=2" }),
      ),
    ).toBe("https://pay.example.com/c?a=1&b=2");
  });
});

describe("renderTemplate: oggetto dell'email", () => {
  it("compila i segnaposto dell'oggetto senza escapare", () => {
    const result = renderTemplate(
      email("Preventivo {{codice}} per {{nome}}", "Ciao"),
      makeContext({ contactName: "Tom & Jerry" }),
    );
    expect(expectRendered(result).subject).toBe(
      "Preventivo VP-2026-0042 per Tom & Jerry",
    );
  });

  it("tiene l'oggetto su una riga anche se un valore va a capo", () => {
    const result = renderTemplate(
      email("Preventivo per {{nome}}", "Ciao"),
      makeContext({ contactName: "Mario\r\nBcc: altro@example.com" }),
    );
    expect(expectRendered(result).subject).toBe(
      "Preventivo per Mario Bcc: altro@example.com",
    );
  });

  it("restituisce un oggetto vuoto (null) per i modelli WhatsApp", () => {
    expect(
      expectRendered(renderTemplate(whatsapp("Ciao"), makeContext())).subject,
    ).toBe(null);
  });
});

describe("testi dei luoghi in messages/*.json", () => {
  it("hanno un nome IT e EN per ogni tipo di luogo", () => {
    expect(Object.keys(it_.Locations).sort()).toEqual(
      [...LOCATION_TYPES].sort(),
    );
    expect(Object.keys(en.Locations).sort()).toEqual(
      [...LOCATION_TYPES].sort(),
    );
  });
});
