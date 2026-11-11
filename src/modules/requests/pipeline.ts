/**
 * Pipeline delle richieste (tabella 4.3 del PRD): quali passaggi di fase sono
 * consentiti, cosa serve per entrare in ogni fase e cosa cambia sulla richiesta.
 * Logica pura: chi salva (pannello, webhook) scrive `changes` e `activity`.
 */

export const STAGES = [
  "new",
  "working",
  "quote_sent",
  "confirmed",
  "on_rent",
  "completed",
  "lost",
  "canceled",
] as const;
export type Stage = (typeof STAGES)[number];

/** Motivi di perdita (sezione 4.5 del PRD). */
export const LOST_REASONS = [
  "price",
  "unavailable",
  "security_deposit",
  "driver_requirements",
  "no_reply",
  "competitor",
  "changed_plans",
  "invalid",
  "other",
] as const;
export type LostReason = (typeof LOST_REASONS)[number];

/** Campi della richiesta che la pipeline legge e scrive. */
export type PipelineRequest = {
  stage: Stage;
  stageChangedAt: Date;
  assignedTo: string | null;
  vehicleId: string | null;
  pickupAt: Date | null;
  returnAt: Date | null;
  quoteTotalCents: number | null;
  firstResponseAt: Date | null;
  lostReason: LostReason | null;
  lostNote: string | null;
};

/** `system` = automazioni e webhook, senza una persona dietro. */
export type ActorRole = "owner" | "operator" | "system";

export type TransitionContext = {
  role: ActorRole;
  /** L'acconto della richiesta risulta pagato. */
  depositPaid: boolean;
};

export type TransitionInput = TransitionContext & {
  /** Chi fa il passaggio (`staff_profiles.id`); `null` = sistema. */
  actorId: string | null;
  now: Date;
  lostReason?: LostReason | null;
  note?: string | null;
};

export type RequiredField =
  | "assignedTo"
  | "vehicleId"
  | "pickupAt"
  | "returnAt"
  | "quoteTotalCents"
  | "lostReason"
  | "note";

export type StageChangedActivity = {
  type: "stage_changed";
  actorId: string | null;
  payload: {
    from: Stage;
    to: Stage;
    reason?: LostReason;
    note?: string;
    confirmation?: "deposit" | "manual";
  };
};

export type TransitionError =
  | { ok: false; error: "notAllowed" }
  | { ok: false; error: "confirmationRequired" }
  | { ok: false; error: "fieldsRequired"; fields: RequiredField[] };

export type TransitionResult<R extends PipelineRequest> =
  | {
      ok: true;
      request: R;
      changes: Partial<PipelineRequest>;
      activity: StageChangedActivity;
    }
  | TransitionError;

/** Passaggi della tabella 4.3: da ogni fase, le fasi raggiungibili. */
const NEXT_STAGES: Readonly<Record<Stage, readonly Stage[]>> = {
  new: ["working", "quote_sent", "lost"],
  working: ["quote_sent", "confirmed", "lost"],
  quote_sent: ["working", "confirmed", "lost"],
  confirmed: ["on_rent", "canceled"],
  on_rent: ["completed"],
  completed: [],
  lost: ["working"],
  canceled: [],
};

function isInTable(from: Stage, to: Stage): boolean {
  return NEXT_STAGES[from].includes(to);
}

/**
 * Il passaggio è consentito? Si entra in `confirmed` solo con l'acconto
 * pagato o con la conferma manuale del titolare. I campi obbligatori li
 * controlla `transition`.
 */
export function canTransition(
  from: Stage,
  to: Stage,
  ctx: TransitionContext,
): boolean {
  if (!isInTable(from, to)) return false;
  if (to === "confirmed") return ctx.depositPaid || ctx.role === "owner";
  return true;
}

function cleanNote(note: string | null | undefined): string | null {
  const trimmed = note?.trim();
  return trimmed ? trimmed : null;
}

function isLostReason(value: unknown): value is LostReason {
  return (LOST_REASONS as readonly unknown[]).includes(value);
}

/** Campi che mancano per entrare nella fase `to`. */
function missingFields(
  request: PipelineRequest,
  to: Stage,
  input: TransitionInput,
  note: string | null,
): RequiredField[] {
  const missing: RequiredField[] = [];
  switch (to) {
    case "working":
      if (!request.assignedTo) missing.push("assignedTo");
      break;
    case "quote_sent":
      if (!request.vehicleId) missing.push("vehicleId");
      if (!request.pickupAt) missing.push("pickupAt");
      if (!request.returnAt) missing.push("returnAt");
      if (!request.quoteTotalCents || request.quoteTotalCents <= 0) {
        missing.push("quoteTotalCents");
      }
      break;
    case "lost":
      if (!isLostReason(input.lostReason)) missing.push("lostReason");
      else if (input.lostReason === "other" && !note) missing.push("note");
      break;
    case "confirmed":
      // Conferma manuale del titolare: la nota spiega perché.
      if (!input.depositPaid && !note) missing.push("note");
      break;
    case "canceled":
      if (!note) missing.push("note");
      break;
  }
  return missing;
}

/**
 * Porta la richiesta nella fase `to`. Restituisce la richiesta aggiornata,
 * i soli campi cambiati (`changes`, da salvare) e l'attività `stage_changed`
 * per la cronologia. La richiesta ricevuta non viene modificata.
 */
export function transition<R extends PipelineRequest>(
  request: R,
  to: Stage,
  input: TransitionInput,
): TransitionResult<R> {
  const from = request.stage;
  if (!isInTable(from, to)) return { ok: false, error: "notAllowed" };
  if (!canTransition(from, to, input)) {
    return { ok: false, error: "confirmationRequired" };
  }

  const note = cleanNote(input.note);
  const fields = missingFields(request, to, input, note);
  if (fields.length > 0) return { ok: false, error: "fieldsRequired", fields };

  const changes: Partial<PipelineRequest> = {
    stage: to,
    stageChangedAt: input.now,
  };
  const payload: StageChangedActivity["payload"] = { from, to };

  if (to === "quote_sent" && !request.firstResponseAt) {
    // Il preventivo è partito: è una comunicazione in uscita.
    changes.firstResponseAt = input.now;
  }
  if (to === "lost" && isLostReason(input.lostReason)) {
    changes.lostReason = input.lostReason;
    changes.lostNote = note;
    payload.reason = input.lostReason;
  }
  if (from === "lost") {
    // "Riapri": la richiesta non è più persa.
    changes.lostReason = null;
    changes.lostNote = null;
  }
  if (to === "confirmed") {
    payload.confirmation = input.depositPaid ? "deposit" : "manual";
  }
  if (note) payload.note = note;

  return {
    ok: true,
    request: { ...request, ...changes },
    changes,
    activity: { type: "stage_changed", actorId: input.actorId, payload },
  };
}

/**
 * Prima comunicazione in uscita (email inviata, WhatsApp confermato, chiamata
 * registrata): imposta `firstResponseAt` solo se non c'è ancora.
 */
export function recordFirstResponse<R extends PipelineRequest>(
  request: R,
  at: Date,
): R {
  if (request.firstResponseAt) return { ...request };
  return { ...request, firstResponseAt: at };
}
