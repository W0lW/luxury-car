import { describe, expect, it } from "vitest";

import {
  canTransition,
  recordFirstResponse,
  transition,
  type PipelineRequest,
  type Stage,
  type TransitionInput,
} from "./pipeline";

const NOW = new Date("2026-11-12T10:00:00.000Z");
const EARLIER = new Date("2026-11-10T08:00:00.000Z");
const OPERATOR_ID = "00000000-0000-4000-8000-000000000001";
const OWNER_ID = "00000000-0000-4000-8000-000000000002";
const VEHICLE_ID = "00000000-0000-4000-8000-0000000000aa";

/** Richiesta con tutti i campi che servono per entrare in ogni fase. */
function makeRequest(
  overrides: Partial<PipelineRequest> = {},
): PipelineRequest {
  return {
    stage: "new",
    stageChangedAt: EARLIER,
    assignedTo: OPERATOR_ID,
    vehicleId: VEHICLE_ID,
    pickupAt: new Date("2026-12-01T09:00:00.000Z"),
    returnAt: new Date("2026-12-04T09:00:00.000Z"),
    quoteTotalCents: 250_000,
    firstResponseAt: null,
    lostReason: null,
    lostNote: null,
    ...overrides,
  };
}

/** Operatore senza acconto pagato: il caso più comune nel pannello. */
function operatorInput(
  overrides: Partial<TransitionInput> = {},
): TransitionInput {
  return {
    role: "operator",
    depositPaid: false,
    actorId: OPERATOR_ID,
    now: NOW,
    ...overrides,
  };
}

const ALL_STAGES: Stage[] = [
  "new",
  "working",
  "quote_sent",
  "confirmed",
  "on_rent",
  "completed",
  "lost",
  "canceled",
];

/** Passaggi consentiti dalla tabella 4.3 del PRD, con i dati che servono. */
const ALLOWED: Array<[Stage, Stage, Partial<TransitionInput>]> = [
  ["new", "working", {}],
  ["new", "quote_sent", {}],
  ["new", "lost", { lostReason: "invalid" }],
  ["working", "quote_sent", {}],
  ["working", "confirmed", { depositPaid: true }],
  ["working", "lost", { lostReason: "no_reply" }],
  ["quote_sent", "working", {}],
  ["quote_sent", "confirmed", { depositPaid: true }],
  ["quote_sent", "lost", { lostReason: "price" }],
  ["confirmed", "on_rent", {}],
  ["confirmed", "canceled", { note: "Il cliente ha perso il volo" }],
  ["on_rent", "completed", {}],
  ["lost", "working", {}],
];

/** Passaggi vietati: tutti gli altri, compreso restare nella stessa fase. */
const FORBIDDEN: Record<Stage, Stage[]> = {
  new: ["new", "confirmed", "on_rent", "completed", "canceled"],
  working: ["new", "working", "on_rent", "completed", "canceled"],
  quote_sent: ["new", "quote_sent", "on_rent", "completed", "canceled"],
  confirmed: ["new", "working", "quote_sent", "confirmed", "completed", "lost"],
  on_rent: [
    "new",
    "working",
    "quote_sent",
    "confirmed",
    "on_rent",
    "lost",
    "canceled",
  ],
  completed: [...ALL_STAGES],
  lost: [
    "new",
    "quote_sent",
    "confirmed",
    "on_rent",
    "completed",
    "lost",
    "canceled",
  ],
  canceled: [...ALL_STAGES],
};

const FORBIDDEN_PAIRS: Array<[Stage, Stage]> = ALL_STAGES.flatMap((from) =>
  FORBIDDEN[from].map((to): [Stage, Stage] => [from, to]),
);

describe("tabella dei passaggi", () => {
  it("consentiti e vietati coprono ogni coppia di fasi una sola volta", () => {
    const pairs = [
      ...ALLOWED.map(([from, to]) => `${from}>${to}`),
      ...FORBIDDEN_PAIRS.map(([from, to]) => `${from}>${to}`),
    ];
    expect(pairs).toHaveLength(64);
    expect(new Set(pairs).size).toBe(64);
  });
});

describe("passaggi consentiti", () => {
  it.each(ALLOWED)("%s -> %s", (from, to, extra) => {
    const input = operatorInput(extra);
    const request = makeRequest({ stage: from });

    expect(canTransition(from, to, input)).toBe(true);

    const result = transition(request, to, input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.request.stage).toBe(to);
    expect(result.request.stageChangedAt).toEqual(NOW);
    expect(result.changes).toMatchObject({ stage: to, stageChangedAt: NOW });
    expect(result.activity).toMatchObject({
      type: "stage_changed",
      actorId: OPERATOR_ID,
      payload: { from, to },
    });
  });
});

describe("passaggi vietati", () => {
  // Contesto più permissivo possibile: il divieto viene solo dalla tabella.
  const permissive = operatorInput({
    role: "owner",
    actorId: OWNER_ID,
    depositPaid: true,
    lostReason: "other",
    note: "Nota",
  });

  it.each(FORBIDDEN_PAIRS)("%s -> %s", (from, to) => {
    expect(canTransition(from, to, permissive)).toBe(false);

    const request = makeRequest({ stage: from });
    const result = transition(request, to, permissive);
    expect(result).toEqual({ ok: false, error: "notAllowed" });
  });
});

describe("in lavorazione (working)", () => {
  it("richiede un assegnatario", () => {
    const request = makeRequest({ stage: "new", assignedTo: null });
    expect(transition(request, "working", operatorInput())).toEqual({
      ok: false,
      error: "fieldsRequired",
      fields: ["assignedTo"],
    });
  });

  it("cambia solo fase e data del cambio", () => {
    const result = transition(makeRequest(), "working", operatorInput());
    expect(result.ok && result.changes).toEqual({
      stage: "working",
      stageChangedAt: NOW,
    });
  });
});

describe("preventivo inviato (quote_sent)", () => {
  it("richiede auto, date e totale", () => {
    const request = makeRequest({
      stage: "working",
      vehicleId: null,
      pickupAt: null,
      returnAt: null,
      quoteTotalCents: null,
    });
    expect(transition(request, "quote_sent", operatorInput())).toEqual({
      ok: false,
      error: "fieldsRequired",
      fields: ["vehicleId", "pickupAt", "returnAt", "quoteTotalCents"],
    });
  });

  it("segnala solo il campo che manca", () => {
    const request = makeRequest({ stage: "working", returnAt: null });
    expect(transition(request, "quote_sent", operatorInput())).toEqual({
      ok: false,
      error: "fieldsRequired",
      fields: ["returnAt"],
    });
  });

  it("non accetta un totale pari a zero", () => {
    const request = makeRequest({ stage: "working", quoteTotalCents: 0 });
    expect(transition(request, "quote_sent", operatorInput())).toEqual({
      ok: false,
      error: "fieldsRequired",
      fields: ["quoteTotalCents"],
    });
  });

  it("registra la prima risposta: il preventivo è una comunicazione in uscita", () => {
    const request = makeRequest({ stage: "working", firstResponseAt: null });
    const result = transition(request, "quote_sent", operatorInput());
    expect(result.ok && result.changes).toEqual({
      stage: "quote_sent",
      stageChangedAt: NOW,
      firstResponseAt: NOW,
    });
  });

  it("non sovrascrive una prima risposta già registrata", () => {
    const request = makeRequest({ stage: "working", firstResponseAt: EARLIER });
    const result = transition(request, "quote_sent", operatorInput());
    expect(result.ok && result.request.firstResponseAt).toEqual(EARLIER);
    expect(result.ok && result.changes).not.toHaveProperty("firstResponseAt");
  });
});

describe("persa (lost)", () => {
  it("richiede il motivo", () => {
    const request = makeRequest({ stage: "working" });
    expect(transition(request, "lost", operatorInput())).toEqual({
      ok: false,
      error: "fieldsRequired",
      fields: ["lostReason"],
    });
  });

  it("rifiuta un motivo che non è nell'elenco 4.5", () => {
    const request = makeRequest({ stage: "working" });
    const input = operatorInput({
      lostReason: "boh" as TransitionInput["lostReason"],
    });
    expect(transition(request, "lost", input)).toEqual({
      ok: false,
      error: "fieldsRequired",
      fields: ["lostReason"],
    });
  });

  it('con il motivo "Altro" richiede la nota', () => {
    const request = makeRequest({ stage: "working" });
    expect(
      transition(request, "lost", operatorInput({ lostReason: "other" })),
    ).toEqual({ ok: false, error: "fieldsRequired", fields: ["note"] });
  });

  it('con il motivo "Altro" una nota di soli spazi non basta', () => {
    const request = makeRequest({ stage: "working" });
    const input = operatorInput({ lostReason: "other", note: "   " });
    expect(transition(request, "lost", input)).toEqual({
      ok: false,
      error: "fieldsRequired",
      fields: ["note"],
    });
  });

  it("salva motivo e nota sulla richiesta e nell'attività", () => {
    const request = makeRequest({ stage: "quote_sent" });
    const input = operatorInput({
      lostReason: "other",
      note: "  Ha noleggiato in Svizzera  ",
    });
    const result = transition(request, "lost", input);
    expect(result.ok && result.changes).toEqual({
      stage: "lost",
      stageChangedAt: NOW,
      lostReason: "other",
      lostNote: "Ha noleggiato in Svizzera",
    });
    expect(result.ok && result.activity).toEqual({
      type: "stage_changed",
      actorId: OPERATOR_ID,
      payload: {
        from: "quote_sent",
        to: "lost",
        reason: "other",
        note: "Ha noleggiato in Svizzera",
      },
    });
  });

  it("con un motivo diverso da Altro la nota è facoltativa", () => {
    const request = makeRequest({ stage: "new" });
    const result = transition(
      request,
      "lost",
      operatorInput({ lostReason: "price" }),
    );
    expect(result.ok && result.changes).toEqual({
      stage: "lost",
      stageChangedAt: NOW,
      lostReason: "price",
      lostNote: null,
    });
  });

  it("Riapri riporta a working e toglie motivo e nota", () => {
    const request = makeRequest({
      stage: "lost",
      lostReason: "other",
      lostNote: "Non risponde",
    });
    const result = transition(request, "working", operatorInput());
    expect(result.ok && result.changes).toEqual({
      stage: "working",
      stageChangedAt: NOW,
      lostReason: null,
      lostNote: null,
    });
  });

  it("Riapri richiede un assegnatario", () => {
    const request = makeRequest({
      stage: "lost",
      lostReason: "price",
      assignedTo: null,
    });
    expect(transition(request, "working", operatorInput())).toEqual({
      ok: false,
      error: "fieldsRequired",
      fields: ["assignedTo"],
    });
  });
});

describe("confermata (confirmed)", () => {
  it("un operatore non conferma senza acconto pagato", () => {
    const input = operatorInput({ depositPaid: false });
    expect(canTransition("quote_sent", "confirmed", input)).toBe(false);
    expect(
      transition(makeRequest({ stage: "quote_sent" }), "confirmed", input),
    ).toEqual({ ok: false, error: "confirmationRequired" });
  });

  it("il titolare può confermare a mano senza acconto", () => {
    const input = operatorInput({ role: "owner", actorId: OWNER_ID });
    expect(canTransition("working", "confirmed", input)).toBe(true);
  });

  it("la conferma manuale del titolare richiede la nota", () => {
    const input = operatorInput({ role: "owner", actorId: OWNER_ID });
    expect(
      transition(makeRequest({ stage: "working" }), "confirmed", input),
    ).toEqual({ ok: false, error: "fieldsRequired", fields: ["note"] });
  });

  it("la conferma manuale resta nella cronologia con la nota", () => {
    const input = operatorInput({
      role: "owner",
      actorId: OWNER_ID,
      note: "Acconto ricevuto con bonifico",
    });
    const result = transition(
      makeRequest({ stage: "quote_sent" }),
      "confirmed",
      input,
    );
    expect(result.ok && result.activity).toEqual({
      type: "stage_changed",
      actorId: OWNER_ID,
      payload: {
        from: "quote_sent",
        to: "confirmed",
        confirmation: "manual",
        note: "Acconto ricevuto con bonifico",
      },
    });
  });

  it("con l'acconto pagato conferma anche il sistema (webhook)", () => {
    const input: TransitionInput = {
      role: "system",
      actorId: null,
      depositPaid: true,
      now: NOW,
    };
    expect(canTransition("quote_sent", "confirmed", input)).toBe(true);
    const result = transition(
      makeRequest({ stage: "quote_sent" }),
      "confirmed",
      input,
    );
    expect(result.ok && result.activity).toEqual({
      type: "stage_changed",
      actorId: null,
      payload: { from: "quote_sent", to: "confirmed", confirmation: "deposit" },
    });
  });

  it("con l'acconto pagato il titolare non deve scrivere la nota", () => {
    const input = operatorInput({
      role: "owner",
      actorId: OWNER_ID,
      depositPaid: true,
    });
    const result = transition(
      makeRequest({ stage: "working" }),
      "confirmed",
      input,
    );
    expect(result.ok && result.activity.payload).toEqual({
      from: "working",
      to: "confirmed",
      confirmation: "deposit",
    });
  });
});

describe("annullata (canceled)", () => {
  it("richiede la nota", () => {
    const request = makeRequest({ stage: "confirmed" });
    expect(transition(request, "canceled", operatorInput())).toEqual({
      ok: false,
      error: "fieldsRequired",
      fields: ["note"],
    });
  });

  it("salva la nota nell'attività", () => {
    const request = makeRequest({ stage: "confirmed" });
    const result = transition(
      request,
      "canceled",
      operatorInput({ note: "Rimborso fatto da Stripe" }),
    );
    expect(result.ok && result.activity.payload).toEqual({
      from: "confirmed",
      to: "canceled",
      note: "Rimborso fatto da Stripe",
    });
  });
});

describe("transition", () => {
  it("una nota facoltativa finisce nell'attività", () => {
    const request = makeRequest({ stage: "confirmed" });
    const result = transition(
      request,
      "on_rent",
      operatorInput({ note: "Consegnata all'hotel" }),
    );
    expect(result.ok && result.activity.payload).toEqual({
      from: "confirmed",
      to: "on_rent",
      note: "Consegnata all'hotel",
    });
  });

  it("non modifica la richiesta ricevuta", () => {
    const request = makeRequest({ stage: "working" });
    const copy = structuredClone(request);
    transition(request, "lost", operatorInput({ lostReason: "price" }));
    expect(request).toEqual(copy);
  });

  it("conserva gli altri campi della richiesta", () => {
    const request = { ...makeRequest(), code: "VP-2026-0001" };
    const result = transition(request, "working", operatorInput());
    expect(result.ok && result.request.code).toBe("VP-2026-0001");
    expect(result.ok && result.request.vehicleId).toBe(VEHICLE_ID);
  });
});

describe("recordFirstResponse", () => {
  it("registra la prima comunicazione in uscita", () => {
    const request = makeRequest({ firstResponseAt: null });
    expect(recordFirstResponse(request, NOW).firstResponseAt).toEqual(NOW);
  });

  it("non sovrascrive la prima risposta con quelle successive", () => {
    const request = makeRequest({ firstResponseAt: EARLIER });
    expect(recordFirstResponse(request, NOW).firstResponseAt).toEqual(EARLIER);
  });

  it("non modifica la richiesta ricevuta", () => {
    const request = makeRequest({ firstResponseAt: null });
    recordFirstResponse(request, NOW);
    expect(request.firstResponseAt).toBeNull();
  });
});
