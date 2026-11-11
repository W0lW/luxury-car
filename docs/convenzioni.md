# Convenzioni del progetto VELOCI PRIVATE

Riassunto operativo delle sezioni 0.1 e 9 di `tasks/prd-veloci-private-sito-crm.md`. In caso di dubbio vale il PRD.

## Prima di ogni storia

Leggere, se esistono: questo file, `GLOSSARY.md`, `docs/adr/`, `design-system/veloci-private/MASTER.md` (una pagina in `design-system/veloci-private/pages/` prevale sul MASTER).

Next.js 16 ha API diverse da quelle note: prima di scrivere codice Next leggere la guida in `node_modules/next/dist/docs/` (vedi `AGENTS.md`).

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run dev` | Sito in locale (`next dev`) |
| `npm run build` | Build di produzione |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (config Next + Prettier) |
| `npm run format` / `npm run format:check` | Prettier: scrive / controlla |
| `npm test` | Test unitari (Vitest) |
| `npm run test:e2e` | Test end-to-end (Playwright) |
| `supabase test db` | Test pgTAP del database (serve Supabase locale, quindi Docker) |

Controlli obbligatori prima di ogni commit: `npm run typecheck && npm run lint && npm test` (e `supabase test db` se la storia tocca il database). "Test passano" vuol dire tutta la suite: un test rosso, anche non causato dalla storia, va segnalato.

## Cartelle

```
src/app/[locale]/...     pagine pubbliche (it alla radice, en sotto /en)
src/app/admin/...        pannello (solo it)
src/app/api/...          track, cron/[job], webhooks/stripe, webhooks/resend
src/modules/             logica di dominio: auth, audit, catalog, requests, messaging,
                         payments, calendar, tracking, stats, jobs
src/components/          interfaccia condivisa
src/lib/                 client Supabase, logger, formattazione date e prezzi, env, image loader
supabase/                migrations/, tests/ (pgTAP), seed.sql
messages/                testi dell'interfaccia: it.json, en.json
content/                 testi approvati dall'azienda
```

## Regole di sviluppo (PRD 0.1)

- Una storia per iterazione, in ordine di ID.
- Logica di dominio (`requests`, `payments`, `messaging`, `calendar`, `tracking`, `stats`) e storie marcate TDD: prima il test, poi il codice. Un test non si modifica per farlo passare.
- Se un criterio fallisce: prima un comando che riproduce l'errore, poi la correzione.
- Storie con interfaccia: verifica nel browser con la skill webapp-testing a 375 e 1440 px.
- Nessun segreto nel codice, nei log, nei commit o negli esempi.

## Architettura (PRD 9.3)

- Moduli profondi: interfacce piccole, molta logica dietro. I servizi esterni (Resend, Stripe, Workers AI, ...) stanno dietro adattatori, ognuno con una versione finta per i test.
- Pagine e route non scrivono sul database: chiamano i moduli.
- Operazioni su più tabelle: funzioni Postgres (una transazione) chiamate via RPC dal server.
- I componenti ricevono solo i dati che mostrano; varianti esplicite, niente prop booleane per cambiare aspetto.
- Ogni modulo si testa dalla sua interfaccia.

## Stile e interfaccia (PRD 9.1)

- TypeScript `strict`; Tailwind con variabili CSS del design system; solo proprietà CSS logiche (`ms-`, `pe-`, `inset-inline`, ...).
- Lingue con next-intl: italiano alla radice, inglese sotto `/en`; testi in `messages/it.json` e `messages/en.json`.
- Validazione con Zod su ogni input; telefoni con libphonenumber-js.

## Dati (PRD 9.4)

- Chiavi `uuid`; orari `timestamptz` in UTC, mostrati in Europe/Rome; importi in centesimi `integer`.
- Testi bilingui in `jsonb` `{ "it": "...", "en": "..." }`; `created_at` e `updated_at` dove servono.
- Migrazioni create con `supabase migration new` (mai nomi inventati); RLS su ogni tabella; `supabase db advisors` senza avvisi di sicurezza prima del commit; test pgTAP in `supabase/tests/`.

## Sicurezza (PRD 9.10)

- Ruolo solo da `staff_profiles`, mai da `user_metadata`.
- Policy di UPDATE con `USING` e `WITH CHECK`, e una policy di SELECT accanto.
- Viste con `security_invoker = true`; funzioni `security definer` solo nello schema `private`, con `search_path = ''` e controllo di `auth.uid()`.
- `SUPABASE_SECRET_KEY` solo in file che importano `server-only`; nessun segreto in variabili `NEXT_PUBLIC_*`.
- Ogni server action verifica sessione e ruolo come una route API; limiti di frequenza su modulo, `/api/track` e login.
- Valori escapati in email e modelli; Markdown sanitizzato; celle CSV neutralizzate.
- Firma verificata su ogni webhook (Stripe, Resend); confronto in tempo costante per `CRON_SECRET`.
- Versioni dei pacchetti fissate (`.npmrc` con `save-exact=true`) e `package-lock.json` committato.

## Variabili e segreti (PRD 9.8)

Elenco completo in `.env.example`. In locale i valori stanno in `.dev.vars` (e `.env.local` per `next dev`), mai committati. Binding Cloudflare: `PHOTOS` (R2), `AI` (Workers AI), `RATE_LIMITER`.

## Immagini e prestazioni (PRD 9.5, 9.6)

- Foto in 4 varianti WebP (640, 1024, 1600, 2400 px) su R2; `next/image` con loader personalizzato, nessuna ottimizzazione a runtime.
- Immagine LCP con `fetchpriority="high"` e `sizes` corretti; le altre `loading="lazy"`; sempre `width` e `height`.
- Budget: JS iniziale ≤ 200 KB compresso, CSS ≤ 50 KB, font ≤ 100 KB, script di tracciamento ≤ 3 KB; LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1; script di terze parti solo dopo idratazione e consenso.

## Test (PRD 9.12)

Vitest per i moduli di dominio; pgTAP per RLS, vincoli e funzioni; Playwright su mobile (375×812) e desktop (1440×900) con axe; Lighthouse CI per le prestazioni.
