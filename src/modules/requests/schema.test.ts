import { describe, expect, it } from "vitest";

import enMessages from "../../../messages/en.json";
import itMessages from "../../../messages/it.json";
import {
  DEFAULT_REQUEST_RULES,
  REQUEST_ERROR_CODES,
  createBookingRequestSchema,
  validateBookingRequest,
  validateContactStep,
  validateRentalStep,
} from "./schema";

// Invio della richiesta: 11/11/2026 alle 10:00 di Roma.
const now = new Date("2026-11-11T09:00:00Z");
const rules = { ...DEFAULT_REQUEST_RULES, now };

const VEHICLE_ID = "3f2b8c1e-6a4d-4f7b-9c2e-1d5a7b9e0c11";

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    vehicleId: VEHICLE_ID,
    pickupAt: "2026-11-20T10:00",
    returnAt: "2026-11-23T10:00",
    pickupLocation: "airport_flr",
    pickupAddress: "",
    returnLocation: "airport_flr",
    returnAddress: "",
    expectedKm: "400",
    secondDriver: false,
    extras: [],
    notes: "",
    fullName: "Mario Rossi",
    email: "mario.rossi@example.com",
    phone: "+39 333 123 4567",
    preferredChannel: "whatsapp",
    privacyAccepted: true,
    marketingConsent: false,
    ...overrides,
  };
}

function errorsOf(input: Record<string, unknown>, options = rules) {
  const result = validateBookingRequest(input, options);
  if (result.success) throw new Error("La richiesta doveva essere rifiutata");
  return result.errors;
}

describe("validateBookingRequest: richiesta valida", () => {
  it("accetta una richiesta completa e restituisce i dati normalizzati", () => {
    const result = validateBookingRequest(validInput(), rules);

    expect(result).toEqual({
      success: true,
      data: {
        vehicleId: VEHICLE_ID,
        pickupAt: new Date("2026-11-20T09:00:00Z"),
        returnAt: new Date("2026-11-23T09:00:00Z"),
        pickupLocation: "airport_flr",
        pickupAddress: undefined,
        returnLocation: "airport_flr",
        returnAddress: undefined,
        expectedKm: 400,
        secondDriver: false,
        extras: [],
        notes: undefined,
        fullName: "Mario Rossi",
        email: "mario.rossi@example.com",
        phone: "+393331234567",
        preferredChannel: "whatsapp",
        privacyAccepted: true,
        marketingConsent: false,
      },
    });
  });

  it('senza auto scelta vale "Consigliatemi voi" (vehicleId nullo)', () => {
    const result = validateBookingRequest(validInput({ vehicleId: "" }), rules);
    expect(result.success && result.data.vehicleId).toBeNull();
  });

  it('accetta i valori di un modulo HTML (checkbox "on", numeri come testo)', () => {
    const result = validateBookingRequest(
      validInput({
        privacyAccepted: "on",
        marketingConsent: "on",
        secondDriver: "on",
        extras: ["extra_insurance", "chauffeur"],
      }),
      rules,
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.privacyAccepted).toBe(true);
    expect(result.data.marketingConsent).toBe(true);
    expect(result.data.secondDriver).toBe(true);
    expect(result.data.extras).toEqual(["extra_insurance", "chauffeur"]);
  });

  it("toglie gli spazi all'inizio e alla fine dei testi", () => {
    const result = validateBookingRequest(
      validInput({ fullName: "  Mario Rossi ", email: " mario@example.com " }),
      rules,
    );
    expect(result.success && result.data.fullName).toBe("Mario Rossi");
    expect(result.success && result.data.email).toBe("mario@example.com");
  });

  it("usa le regole predefinite di settings: 24 ore di preavviso e 90 giorni al massimo", () => {
    expect(DEFAULT_REQUEST_RULES).toEqual({
      minLeadHours: 24,
      maxRentalDays: 90,
    });
  });
});

describe("regola: ritiro almeno min_lead_hours dopo l'invio", () => {
  it("rifiuta un ritiro tra meno di 24 ore", () => {
    expect(
      errorsOf(
        validInput({
          pickupAt: "2026-11-12T09:59",
          returnAt: "2026-11-14T10:00",
        }),
      ).pickupAt,
    ).toEqual({ code: "pickupTooSoon", values: { hours: 24 } });
  });

  it("accetta un ritiro esattamente 24 ore dopo l'invio", () => {
    const result = validateBookingRequest(
      validInput({
        pickupAt: "2026-11-12T10:00",
        returnAt: "2026-11-14T10:00",
      }),
      rules,
    );
    expect(result.success).toBe(true);
  });

  it("rifiuta un ritiro nel passato", () => {
    expect(
      errorsOf(
        validInput({
          pickupAt: "2026-11-01T10:00",
          returnAt: "2026-11-03T10:00",
        }),
      ).pickupAt?.code,
    ).toBe("pickupTooSoon");
  });

  it("usa il preavviso di settings", () => {
    const errors = errorsOf(
      validInput({
        pickupAt: "2026-11-13T09:00",
        returnAt: "2026-11-15T10:00",
      }),
      { ...rules, minLeadHours: 48 },
    );
    expect(errors.pickupAt).toEqual({
      code: "pickupTooSoon",
      values: { hours: 48 },
    });
  });
});

describe("regola: riconsegna dopo il ritiro", () => {
  it("rifiuta una riconsegna prima del ritiro", () => {
    expect(
      errorsOf(validInput({ returnAt: "2026-11-19T10:00" })).returnAt,
    ).toEqual({ code: "returnBeforePickup" });
  });

  it("rifiuta una riconsegna alla stessa ora del ritiro", () => {
    expect(
      errorsOf(validInput({ returnAt: "2026-11-20T10:00" })).returnAt?.code,
    ).toBe("returnBeforePickup");
  });
});

describe("regola: durata tra 1 e max_rental_days giorni", () => {
  it("rifiuta un noleggio più corto di un giorno", () => {
    expect(
      errorsOf(validInput({ returnAt: "2026-11-21T09:59" })).returnAt,
    ).toEqual({ code: "durationTooShort" });
  });

  it("accetta un noleggio di un giorno esatto", () => {
    const result = validateBookingRequest(
      validInput({ returnAt: "2026-11-21T10:00" }),
      rules,
    );
    expect(result.success).toBe(true);
  });

  it("accetta 90 giorni esatti anche se in mezzo cambia l'ora", () => {
    // Dal 20/09/2027 al 19/12/2027: il 31/10 l'ora torna indietro (90 giorni e 1 ora reali).
    const result = validateBookingRequest(
      validInput({
        pickupAt: "2027-09-20T10:00",
        returnAt: "2027-12-19T10:00",
      }),
      rules,
    );
    expect(result.success).toBe(true);
  });

  it("rifiuta un noleggio più lungo di 90 giorni", () => {
    expect(
      errorsOf(validInput({ returnAt: "2027-02-18T10:01" })).returnAt,
    ).toEqual({ code: "durationTooLong", values: { days: 90 } });
  });

  it("usa la durata massima di settings", () => {
    expect(
      errorsOf(validInput({ returnAt: "2026-12-01T10:00" }), {
        ...rules,
        maxRentalDays: 10,
      }).returnAt,
    ).toEqual({ code: "durationTooLong", values: { days: 10 } });
  });
});

describe("regola: date e ore valide", () => {
  it("chiede la data di ritiro se manca", () => {
    expect(errorsOf(validInput({ pickupAt: "" })).pickupAt).toEqual({
      code: "dateRequired",
    });
  });

  it("rifiuta una data che non esiste", () => {
    expect(
      errorsOf(validInput({ returnAt: "2026-11-31T10:00" })).returnAt,
    ).toEqual({
      code: "dateInvalid",
    });
  });
});

describe("regola: luogo e indirizzo", () => {
  it.each(["airport_flr", "airport_psa", "hotel", "address", "other"])(
    "accetta il luogo %s",
    (location) => {
      const result = validateBookingRequest(
        validInput({
          pickupLocation: location,
          pickupAddress: "Via de' Tornabuoni 1, Firenze",
          returnLocation: location,
          returnAddress: "Via de' Tornabuoni 1, Firenze",
        }),
        rules,
      );
      expect(result.success).toBe(true);
    },
  );

  it("rifiuta un luogo sconosciuto", () => {
    expect(
      errorsOf(validInput({ pickupLocation: "station" })).pickupLocation,
    ).toEqual({
      code: "locationRequired",
    });
  });

  it.each(["hotel", "address", "other"])(
    "chiede l'indirizzo di consegna per %s",
    (location) => {
      expect(
        errorsOf(validInput({ pickupLocation: location, pickupAddress: "  " }))
          .pickupAddress,
      ).toEqual({ code: "addressRequired" });
    },
  );

  it("chiede l'indirizzo di riconsegna per hotel", () => {
    expect(
      errorsOf(validInput({ returnLocation: "hotel", returnAddress: "" }))
        .returnAddress,
    ).toEqual({ code: "addressRequired" });
  });

  it("non chiede l'indirizzo per gli aeroporti", () => {
    const result = validateBookingRequest(
      validInput({
        pickupLocation: "airport_psa",
        returnLocation: "airport_flr",
      }),
      rules,
    );
    expect(result.success).toBe(true);
  });
});

describe("regola: email valida", () => {
  it("chiede l'email se manca", () => {
    expect(errorsOf(validInput({ email: " " })).email).toEqual({
      code: "emailRequired",
    });
  });

  it("rifiuta un'email non valida", () => {
    expect(errorsOf(validInput({ email: "mario@" })).email).toEqual({
      code: "emailInvalid",
    });
  });
});

describe("regola: telefono convertito in E.164", () => {
  it("converte un numero italiano senza prefisso", () => {
    const result = validateBookingRequest(
      validInput({ phone: "333 123 4567" }),
      rules,
    );
    expect(result.success && result.data.phone).toBe("+393331234567");
  });

  it("converte un numero straniero con prefisso 00", () => {
    const result = validateBookingRequest(
      validInput({ phone: "0044 20 7946 0958" }),
      rules,
    );
    expect(result.success && result.data.phone).toBe("+442079460958");
  });

  it("chiede il telefono se manca", () => {
    expect(errorsOf(validInput({ phone: "" })).phone).toEqual({
      code: "phoneRequired",
    });
  });

  it("rifiuta un numero non valido", () => {
    expect(errorsOf(validInput({ phone: "+39 12" })).phone).toEqual({
      code: "phoneInvalid",
    });
  });
});

describe("regola: nome obbligatorio", () => {
  it("chiede il nome se manca", () => {
    expect(errorsOf(validInput({ fullName: "   " })).fullName).toEqual({
      code: "nameRequired",
    });
  });

  it("rifiuta un nome troppo lungo", () => {
    expect(
      errorsOf(validInput({ fullName: "a".repeat(121) })).fullName,
    ).toEqual({
      code: "tooLong",
      values: { max: 120 },
    });
  });
});

describe("regola: consenso privacy obbligatorio", () => {
  it.each([false, undefined, "", "off"])("rifiuta il consenso %j", (value) => {
    expect(
      errorsOf(validInput({ privacyAccepted: value })).privacyAccepted,
    ).toEqual({
      code: "privacyRequired",
    });
  });
});

describe("regola: consenso marketing separato e facoltativo", () => {
  it("senza consenso marketing la richiesta è valida e il consenso è falso", () => {
    const result = validateBookingRequest(
      validInput({ marketingConsent: undefined }),
      rules,
    );
    expect(result.success && result.data.marketingConsent).toBe(false);
  });

  it("il consenso marketing non sostituisce quello privacy", () => {
    const errors = errorsOf(
      validInput({ privacyAccepted: false, marketingConsent: true }),
    );
    expect(errors.privacyAccepted?.code).toBe("privacyRequired");
  });
});

describe("altri campi del modulo", () => {
  it("rifiuta un'auto con identificativo non valido", () => {
    expect(errorsOf(validInput({ vehicleId: "ferrari" })).vehicleId).toEqual({
      code: "vehicleInvalid",
    });
  });

  it("rifiuta km previsti non validi", () => {
    expect(errorsOf(validInput({ expectedKm: "-5" })).expectedKm).toEqual({
      code: "kmInvalid",
    });
  });

  it("km previsti facoltativi", () => {
    const result = validateBookingRequest(
      validInput({ expectedKm: "" }),
      rules,
    );
    expect(result.success && result.data.expectedKm).toBeUndefined();
  });

  it("rifiuta un extra sconosciuto", () => {
    expect(errorsOf(validInput({ extras: ["jetpack"] })).extras).toEqual({
      code: "extraInvalid",
    });
  });

  it("rifiuta note troppo lunghe", () => {
    expect(errorsOf(validInput({ notes: "a".repeat(2001) })).notes).toEqual({
      code: "tooLong",
      values: { max: 2000 },
    });
  });

  it("chiede il canale preferito", () => {
    expect(
      errorsOf(validInput({ preferredChannel: "" })).preferredChannel,
    ).toEqual({
      code: "channelRequired",
    });
  });
});

describe("errori di più campi insieme", () => {
  it("segnala insieme gli errori del noleggio e quelli dei contatti", () => {
    const errors = errorsOf(
      validInput({
        returnAt: "2026-11-19T10:00",
        pickupLocation: "hotel",
        email: "non-valida",
        expectedKm: "molti",
      }),
    );

    expect(errors).toEqual({
      returnAt: { code: "returnBeforePickup" },
      pickupAddress: { code: "addressRequired" },
      email: { code: "emailInvalid" },
      expectedKm: { code: "kmInvalid" },
    });
  });

  it("un input che non è un oggetto dà un errore generale", () => {
    expect(errorsOf(null as unknown as Record<string, unknown>)).toEqual({
      form: { code: "invalid" },
    });
  });
});

describe("validazione per passi del modulo", () => {
  it("il passo 1 controlla solo il noleggio", () => {
    const { fullName, email, phone, privacyAccepted, ...rental } = validInput();
    void [fullName, email, phone, privacyAccepted];

    expect(validateRentalStep(rental, rules).success).toBe(true);
    const tooSoon = validateRentalStep(
      { ...rental, pickupAt: "2026-11-11T12:00" },
      rules,
    );
    expect(!tooSoon.success && tooSoon.errors.pickupAt?.code).toBe(
      "pickupTooSoon",
    );
  });

  it("il passo 2 controlla solo i contatti", () => {
    const result = validateContactStep({
      fullName: "Mario Rossi",
      email: "mario@example.com",
      phone: "+39 333 123 4567",
      preferredChannel: "email",
      privacyAccepted: false,
    });

    expect(result).toEqual({
      success: false,
      errors: { privacyAccepted: { code: "privacyRequired" } },
    });
  });
});

describe("createBookingRequestSchema", () => {
  it("è uno schema Zod che usa le stesse regole", () => {
    const schema = createBookingRequestSchema(rules);
    expect(schema.safeParse(validInput()).success).toBe(true);
    expect(
      schema.safeParse(validInput({ returnAt: "2026-11-19T10:00" })).success,
    ).toBe(false);
  });

  it("senza now usa l'orario attuale", () => {
    const schema = createBookingRequestSchema();
    const past = validInput({
      pickupAt: "2020-01-10T10:00",
      returnAt: "2020-01-12T10:00",
    });
    expect(schema.safeParse(past).success).toBe(false);
  });
});

describe("messaggi d'errore IT/EN", () => {
  // Valori che lo schema passa insieme al codice dell'errore.
  const PLACEHOLDERS: Record<string, string[]> = {
    pickupTooSoon: ["hours"],
    durationTooLong: ["days"],
    tooLong: ["max"],
  };

  function placeholders(text: string) {
    return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
  }

  it.each(REQUEST_ERROR_CODES)(
    "%s ha un testo in italiano e in inglese con i segnaposto giusti",
    (code) => {
      const itText = (
        itMessages.BookingRequestForm.errors as Record<string, string>
      )[code];
      const enText = (
        enMessages.BookingRequestForm.errors as Record<string, string>
      )[code];

      expect(itText?.trim()).toBeTruthy();
      expect(enText?.trim()).toBeTruthy();
      expect(itText).not.toBe(enText);
      expect(placeholders(itText)).toEqual(PLACEHOLDERS[code] ?? []);
      expect(placeholders(enText)).toEqual(PLACEHOLDERS[code] ?? []);
    },
  );

  it("non ci sono testi per codici che lo schema non usa", () => {
    const codes = [...REQUEST_ERROR_CODES].sort();
    expect(Object.keys(itMessages.BookingRequestForm.errors).sort()).toEqual(
      codes,
    );
    expect(Object.keys(enMessages.BookingRequestForm.errors).sort()).toEqual(
      codes,
    );
  });
});
