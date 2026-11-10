# PRD — VELOCI PRIVATE: sito pubblico + CRM (Fase 1 "Completo")

| | |
|---|---|
| Versione | 1.0 — bozza da approvare |
| Data | 10/11/2026 |
| Cliente | VELOCI PRIVATE \| Luxury Car Rental (Firenze) |
| Fonti | Brief strategico del 09/11/2026 (domande D1–D83) · `PIANO-v3.md` · `docs/preventivo-veloci-private.md` · decisioni del 10/11/2026 |
| Perimetro | Pacchetto **Completo** del preventivo (6.900 € + IVA) |
| Esecuzione | Ralph (agente autonomo): una storia per iterazione |
| Branch | `ralph/veloci-sito-crm` |

**Decisioni del 10/11/2026 alla base di questo PRD**
1. Perimetro: Fase 1 Completo. La Fase 2 resta fuori (sezione 7).
2. Acconto del 20%: l'operatore crea il link Stripe dal pannello con un clic, sul conto Stripe dell'azienda. Il CRM registra il pagamento da solo (webhook).
3. Sito pubblico in stile "premium leggero": foto e video reali, movimento discreto. Niente 3D né storyscrolling.
4. Sviluppo con Ralph: storie piccole, in ordine di dipendenza.

## Indice

0. Come usare questo PRD
1. Introduzione
2. Obiettivi
3. Glossario
4. Ruoli, pagine e pipeline
5. Storie utente (US-001 – US-112)
6. Requisiti funzionali
7. Fuori perimetro
8. Indicazioni di design
9. Indicazioni tecniche
10. Metriche di successo
11. Domande aperte

---

## 0. Come usare questo PRD

### 0.1 Regole per Ralph

- Una storia = una iterazione. Le storie si eseguono in ordine di ID e nessuna dipende da una successiva.
- Prima di ogni storia leggere `docs/convenzioni.md`, `GLOSSARY.md`, `docs/adr/` e `design-system/veloci-private/MASTER.md`. Se esiste una pagina specifica in `design-system/veloci-private/pages/`, le sue regole prevalgono sul MASTER.
- Logica di dominio (moduli `requests`, `payments`, `messaging`, `calendar`, `tracking`, `stats`): prima il test, poi il codice (skill `test-driven-development`). Le storie marcate **TDD** lo richiedono in modo esplicito.
- Se un criterio fallisce, prima si costruisce un comando che riproduce l'errore (skill `diagnosing-bugs` e `systematic-debugging`), poi si corregge. Un test non si modifica per farlo passare.
- Criteri standard da mantenere nella conversione in `prd.json`:
  - `Typecheck e lint passano` (`npm run typecheck && npm run lint`): in ogni storia.
  - `Test passano` (`npm test`; per il database anche `supabase test db`): nelle storie con logica. Vuol dire tutta la suite, non solo il test nuovo.
  - `Verifica nel browser con webapp-testing a 375 e 1440 px`: nelle storie con interfaccia. Sostituisce "Verify in browser using dev-browser skill" della skill ralph, perché dev-browser non è installata.
- Nessun segreto nel codice, nei log o negli esempi. In locale stanno in `.dev.vars`; in staging e produzione nei secret di Cloudflare e di GitHub.
- Conversione: lanciare `/ralph` su questo file. Risultato atteso: `prd.json` con `branchName: "ralph/veloci-sito-crm"`.

### 0.2 Cancelli umani

Ralph non può superarli da solo. Una storia bloccata da un cancello aperto si salta e si segnala in `progress.txt`.

| Cancello | Cosa serve | Chi lo prepara | Quando | Blocca |
|---|---|---|---|---|
| GATE-0 | Preventivo Completo accettato e perimetro confermato per iscritto | account-commerciale | Prima di tutto | Tutto |
| GATE-1 | Account a nome dell'azienda: GitHub, Cloudflare (probabile Workers Paid), Supabase (staging e produzione), Resend con dominio verificato, Stripe con verifica completata (chiave limitata e segreto webhook), Turnstile; dominio registrato | devops | Entro 27/11/2026 | Pubblicazione su staging. In locale si lavora anche senza |
| GATE-2 | Direzione visiva scelta dall'azienda e salvata in `design-system/veloci-private/MASTER.md` | designer-ui | Fine F1 (27/11/2026) | US-017 e tutte le storie con interfaccia |
| GATE-3 | Contenuti reali: lista auto con prezzi, foto, servizi, zone, testi legali | l'azienda | Avvio entro 27/11; versione definitiva prima del collaudo | Messa online |
| GATE-4 | Via libera del consulente privacy su informativa, cookie policy e analisi IA delle visite | garante-privacy prepara il dossier | Prima di attivare l'epic N in produzione | Tracciamento e tag in produzione |
| GATE-5 | Collaudo su staging approvato dall'azienda | collaudatore-qa | Dopo US-112 | Messa online |

### 0.3 Preparazione in F1 (prima di Ralph)

| # | Attività | Agente | Skill | Risultato |
|---|---|---|---|---|
| 1 | Glossario dal capitolo 3 | analista-requisiti | domain-modeling | `GLOSSARY.md` |
| 2 | ADR 0001–0005 (sezione 9.2) | architetto-software | domain-modeling | `docs/adr/` |
| 3 | Contesto di prodotto: pubblico, tono, obiettivi, modalità di ogni superficie | designer-ui | impeccable (`init`) | `PRODUCT.md` |
| 4 | Due direzioni visive (sezione 8.2) con mockup mobile e desktop di home, scheda auto, modulo, inbox e scheda richiesta | designer-ui | ui-taste (ricerca riferimenti), ui-ux-pro-max (`--design-system`), frontend-design (piano in due passaggi), impeccable (`shape`) | `docs/design/` e, dopo la scelta, `design-system/veloci-private/MASTER.md` (`--persist --output-dir <radice del progetto>`) |
| 5 | Personas provvisorie da fonti indirette: recensioni dei concorrenti indicati in D36 | marketing-growth | customer-research | `docs/marketing/personas.md`, ogni persona marcata come ipotesi |
| 6 | Gerarchia del messaggio e testi di home, scheda tipo, FAQ, email e modelli | redattore-contenuti | copywriting, landing-page-copywriter, sales-enablement | `content/it/`, `content/en/`, `docs/contenuti/modelli-messaggio.md` |
| 7 | Parole chiave, mappa delle pagine SEO e 15 domande da monitorare sulle IA | esperto-seo | seo, seo-audit, ai-seo | `docs/seo/mappa-keyword.md`, `docs/seo/prompt-ia.md` |
| 8 | Fasi, SLA e assegnazione confermati con l'azienda | direttore-progetto | revops | Tabella 4.3 approvata |
| 9 | Piano di tracciamento e prompt IA con 3–4 esempi | marketing-growth, garante-privacy | — | `docs/tracciamento.md` |
| 10 | Spike tecnico (mezza giornata): Next.js su Workers con OpenNext + Supabase + Workers AI | architetto-software | supabase | Esito in `docs/adr/0001-hosting.md` |

### 0.4 Dove si usa ogni skill del progetto

| Skill | Uso in questo progetto |
|---|---|
| prd | Ha prodotto questo documento |
| domain-modeling | `GLOSSARY.md` e ADR in F1; aggiornare il glossario quando nasce un termine nuovo |
| codebase-design | Moduli profondi con adattatori (sezione 9.3) |
| improve-codebase-architecture | Revisione dopo l'epic H e prima della messa online. Si lancia a mano: `/improve-codebase-architecture` |
| test-driven-development | Storie TDD e tutta la logica di dominio |
| systematic-debugging, diagnosing-bugs | Ogni volta che un test o un criterio fallisce |
| webapp-testing | Verifica nel browser delle storie con interfaccia; test end-to-end (US-110) |
| supabase | Migrazioni, Auth con secondo fattore, RLS, client SSR, CLI |
| supabase-postgres-best-practices | Schema, indici, vincoli, policy RLS efficienti, job di pulizia |
| nodejs-backend-patterns | Route e server action: validazione Zod, errori tipizzati, log strutturati, limiti di frequenza |
| vercel-react-best-practices | Niente richieste a cascata, `after()` per lavori non bloccanti, server action autenticate, script di terze parti dopo l'idratazione |
| vercel-composition-patterns | Componenti con varianti esplicite (card auto, badge, fasi), niente prop booleane per cambiare aspetto |
| vercel-react-view-transitions | Transizione condivisa card → scheda auto, galleria avanti/indietro, comparsa dei contenuti caricati |
| performance-optimization | Budget di sezione 9.6, Lighthouse CI, immagini |
| ui-ux-pro-max | Design system (sezione 8.2), regole UX per moduli, tocco, accessibilità e grafici |
| frontend-design | Direzioni visive lontane dai default di settore; regole di scrittura dell'interfaccia |
| impeccable | `init` e `shape` in F1; `critique`, `audit`, `polish` e `harden` a fine epic F e H |
| ui-taste | Ricerca di riferimenti prima delle direzioni visive; verifica visiva finale |
| design-motion-principles | Regole di movimento (sezione 8.4); audit del movimento prima della messa online |
| animation-vocabulary | Nomi esatti degli effetti nelle specifiche e nelle richieste al designer |
| web-design-guidelines | Revisione dell'interfaccia a fine epic F, H e N |
| writing-guidelines | Revisione dei testi dell'interfaccia e del manuale operatore |
| copywriting | Testi delle pagine: nessuna prova inventata, nessun tic da IA |
| landing-page-copywriter | Home e pagine città: gerarchia del messaggio, varianti di titolo e di CTA |
| sales-enablement | Risposte alle obiezioni (cauzione, disponibilità) in FAQ e modelli; struttura dell'email di preventivo |
| customer-research | Personas provvisorie; dopo il lancio, analisi dei motivi di perdita |
| revops | Fasi, SLA, assegnazione, automazioni e metriche del CRM (sezione 4) |
| churn-prevention | Promemoria per acconti non pagati e link scaduti; motivi di perdita strutturati; riattivazione solo con consenso |
| seo | Metadata, canonical, sitemap, robots, JSON-LD, hreflang |
| seo-audit | Controllo prima della messa online; SEO locale senza sede aperta al pubblico (sezione 8.6) |
| ai-seo | Contenuti citabili dalle IA, `llms.txt`, regole per i crawler, monitoraggio mensile |
| deploy-to-vercel, vercel-cli-with-tokens, vercel-optimize | Solo se si attiva il piano B (hosting su Vercel, ADR-0001) |
| threejs-animation | Non usata: il 3D è escluso dalla scelta "premium leggero". Utile in Fase 2 per un eventuale configuratore |
| ios-design, vercel-react-native-skills | Non usate: nessuna app nativa |
| dotnet-backend-patterns | Non usata: il backend è in TypeScript |

---

## 1. Introduzione

VELOCI PRIVATE è un noleggio di auto di lusso in costituzione a Firenze (D5, D6). Non ha una sede aperta al pubblico: consegna in aeroporto, in hotel o a domicilio, su appuntamento (D20). Al lancio avrà più di 25 auto di partner esterni (D16, D17), con prezzi da 1.500 € al giorno in bassa stagione e da 2.000 a 3.000 € in alta (D24). Oggi non ha sito, logo né CRM (D39, D40, D56) e riceve richieste da molti canali (D57).

L'obiettivo a 12 mesi è ottenere prenotazioni pagate dal sito (D11), con un acconto online del 20% e conferma successiva (D42, D47). Le difficoltà principali sono il posizionamento su Google e sulle IA e il tasso di conversione (D14). Il lancio è previsto entro il 9 febbraio 2027 (D15).

Questo PRD descrive quattro cose:
1. **Sito pubblico** in italiano e inglese, mobile-first: catalogo, schede auto, pagine città e aeroporti, blog, FAQ e modulo "Richiedi la prenotazione" in 2 passi.
2. **CRM nel pannello**: tutte le richieste (dal sito e inserite a mano) in una sola pipeline, con assegnazione, promemoria, modelli email e WhatsApp, link Stripe per l'acconto, calendario interno e statistiche.
3. **Misurazione**: banner cookie, tracciamento interno con riassunto IA delle visite, GA4, Google Ads e Meta Pixel con consenso.
4. **SEO tecnica e contenuti citabili dalle IA.**

```
Visitatore ─► scheda auto ─► "Richiedi la prenotazione" (2 passi)
                                   │
                                   ▼
          CRM: richiesta "Nuova" ─► email al cliente + notifica al team
                                   │  l'operatore verifica auto (partner) e documenti
                                   ▼
          "Preventivo inviato": prezzo + link Stripe per l'acconto (20%)
                                   │  il cliente paga su Stripe Checkout
                                   ▼
          webhook Stripe ─► "Confermata" + auto bloccata nel calendario
                                   │  promemoria ritiro 24 ore prima
                                   ▼
          "In corso" ─► "Conclusa" ─► richiesta di recensione

Uscite: "Persa" (con motivo) da ogni fase aperta; "Annullata" dopo la conferma.
```

---

## 2. Obiettivi

- Sito e CRM online entro il 09/02/2027, con obiettivo interno il 22/01/2027.
- Il 100% delle richieste (sito, WhatsApp, telefono, Instagram, email, hotel, partner, marketplace) sta in un solo CRM.
- Link di pagamento dell'acconto creato in al massimo 2 clic; il CRM registra il pagamento entro 1 minuto dalla notifica di Stripe.
- Conversione visite → richieste misurata e in evidenza nel pannello (obiettivo dell'azienda: ≥ 1%, D83).
- Tempo di prima risposta misurato per ogni richiesta, con allerta oltre lo SLA.
- Core Web Vitals "buoni" su mobile per home, catalogo e scheda auto: LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1.
- Lighthouse mobile: Performance ≥ 90, Accessibilità ≥ 95, Best practice ≥ 95, SEO ≥ 95.
- Tutte le pagine pubbliche in IT ed EN, con hreflang reciproci. Layout pronto per FR e AR in Fase 2.
- Costi ricorrenti dei servizi ≤ 300 €/anno, commissioni Stripe escluse.

---

## 3. Glossario

Base per `GLOSSARY.md`. Nell'interfaccia si usa la colonna "Termine"; nel codice la colonna "Nel codice".

| Termine | Nel codice | Definizione | Evitare |
|---|---|---|---|
| Auto | `vehicle` | Un modello della flotta nel catalogo, con prezzo "a partire da" e condizioni. | macchina, veicolo, prodotto |
| Partner | `fleet_partner` | Azienda terza proprietaria di una o più auto (D19). Non compare mai sul sito. | fornitore, noleggiatore |
| Contatto | `contact` | Persona con recapiti e consensi; può avere più richieste. | lead, utente, account |
| Cliente | — | Contatto con almeno una richiesta confermata. | — |
| Richiesta | `request` | Domanda di noleggio (auto, date, luogo) di un contatto, da qualsiasi canale. Attraversa tutte le fasi fino a conclusa, persa o annullata. | lead, ordine, opportunità |
| Fase | `stage` | Punto della pipeline in cui si trova una richiesta (tabella 4.3). | stato, step |
| Preventivo | `quote_*` | Totale e condizioni proposti al cliente per una richiesta. | offerta, quotazione |
| Acconto | `payment` con `kind = deposit` | Il 20% del totale (D47), pagato online con un link Stripe. Il pagamento conferma la richiesta. | caparra, cauzione, deposito |
| Saldo | `payment` con `kind = balance` | Il resto del totale, pagato con un secondo link o al ritiro (D46). | — |
| Cauzione | `security_deposit_cents` | Garanzia da 5.000 a 30.000 € secondo l'auto (D28), gestita dall'azienda al ritiro. Sul sito compare solo l'importo indicativo. | deposito, acconto |
| Link di pagamento | `payment.url` | Pagina Stripe Checkout creata dal pannello per un acconto o un saldo. Scade dopo 23 ore. | — |
| Canale | `channel` | Mezzo da cui arriva la richiesta: sito, WhatsApp, telefono, Instagram, email, hotel/concierge, partner, marketplace, altro (D57). | sorgente |
| Fonte | `source`, `acquisition` | Per le richieste dal sito: UTM, referrer e pagina d'arrivo, riassunti in Ads, Organico, Social, Diretto, Referral. | canale |
| Operatore | `staff_profile` con `role = operator` | Persona dell'azienda che usa il pannello. | admin, agente |
| Titolare | `staff_profile` con `role = owner` | Operatore con tutti i permessi: utenti, impostazioni, esportazioni, pagamenti manuali. | superadmin |
| Assegnatario | `assigned_to` | Operatore responsabile di una richiesta. | owner |
| Attività | `request_activity` | Evento nella cronologia di una richiesta: email, chiamata, nota, cambio di fase, pagamento. | log |
| Promemoria | `task` | Cosa da fare entro una data per una richiesta. | todo |
| Modello | `message_template` | Testo email o WhatsApp con segnaposto. | template, risposta salvata |
| Blocco | `vehicle_block` | Periodo in cui un'auto non è disponibile: noleggio confermato, manutenzione, lavaggio, trasferimento, altro noleggio, documenti (D23). | prenotazione, evento |
| Margine tra noleggi | `rental_buffer_hours` | Ore minime tra una riconsegna e il ritiro successivo della stessa auto. Predefinito 24 (D22). | — |
| Visita | `visit_session` | Navigazione di un visitatore che ha accettato i cookie statistici. Si chiude dopo 30 minuti di inattività. | sessione utente |
| Visita significativa | `significant` | Visita con almeno 2 pagine o 30 secondi. Solo queste ricevono un riassunto IA. | — |
| Riassunto IA | `visit_summary` | 2–3 frasi su cosa ha guardato il visitatore e perché probabilmente è uscito. È sempre un'ipotesi. | analisi, diagnosi |
| Pagina città | `location_page` | Pagina per una zona di consegna reale: Firenze, Aeroporto di Firenze, Aeroporto di Pisa. | landing |
| SLA di prima risposta | `first_response_sla_minutes` | Tempo massimo, negli orari di lavoro, tra l'arrivo di una richiesta e il primo contatto in uscita. | — |

---

## 4. Ruoli, pagine e pipeline

### 4.1 Ruoli e permessi

| Azione | Visitatore | Operatore | Titolare |
|---|:-:|:-:|:-:|
| Vedere il sito e inviare richieste | ✓ | ✓ | ✓ |
| Gestire richieste, contatti, promemoria e messaggi | — | ✓ | ✓ |
| Creare link di pagamento Stripe | — | ✓ | ✓ |
| Gestire flotta, calendario, modelli e contenuti | — | ✓ | ✓ |
| Vedere visitatori e statistiche | — | ✓ | ✓ |
| Pagamenti manuali e conferma manuale | — | — | ✓ |
| Utenti, impostazioni, esportazioni, registro attività | — | — | ✓ |
| Unire contatti, cancellare dati (GDPR), eliminare richieste | — | — | ✓ |

### 4.2 Mappa delle pagine

**Sito pubblico** (italiano alla radice, inglese sotto `/en`)

| Pagina | Italiano | Inglese | Indicizzata |
|---|---|---|:-:|
| Home | `/` | `/en` | sì |
| Catalogo | `/auto` | `/en/cars` | sì (con filtri: no) |
| Scheda auto | `/auto/[slug]` | `/en/cars/[slug]` | sì |
| Auto esclusive | `/auto-esclusive` | `/en/exclusive-cars` | sì |
| Marca | `/marche/[marca]` | `/en/brands/[brand]` | sì |
| Firenze | `/noleggio-auto-lusso-firenze` | `/en/luxury-car-rental-florence` | sì |
| Aeroporto di Firenze | `/noleggio-auto-lusso-aeroporto-firenze` | `/en/luxury-car-rental-florence-airport` | sì |
| Aeroporto di Pisa | `/noleggio-auto-lusso-aeroporto-pisa` | `/en/luxury-car-rental-pisa-airport` | sì |
| Servizi | `/servizi` | `/en/services` | sì |
| Cauzione | `/come-funziona-la-cauzione` | `/en/security-deposit` | sì |
| FAQ | `/faq` | `/en/faq` | sì |
| Chi siamo | `/chi-siamo` | `/en/about` | sì |
| Contatti | `/contatti` | `/en/contact` | sì |
| Blog | `/blog`, `/blog/[slug]` | `/en/blog`, `/en/blog/[slug]` | sì |
| Richiesta generica | `/richiedi` | `/en/request` | sì |
| Richiesta inviata | `/richiesta-inviata` | `/en/request-sent` | no |
| Ritorno dal pagamento | `/pagamento-ricevuto`, `/pagamento-annullato` | `/en/payment-received`, `/en/payment-canceled` | no |
| Legali | `/privacy`, `/cookie`, `/termini` | `/en/privacy`, `/en/cookies`, `/en/terms` | sì |
| File per le IA | `/llms.txt`, `/flotta.md` | — | — |

Gli slug di città e aeroporti stanno nel database (`location_pages`): una rotta dinamica di primo livello risolve solo gli slug pubblicati, altrimenti 404.

**Pannello** (solo italiano, `noindex`, escluso da `robots.txt`)

`/admin` (cruscotto) · `/admin/richieste` e `/admin/richieste/[codice]` · `/admin/contatti` e `/admin/contatti/[id]` · `/admin/calendario` · `/admin/flotta`, `/admin/flotta/[id]`, `/admin/flotta/partner` · `/admin/modelli` · `/admin/visitatori` e `/admin/visitatori/[id]` · `/admin/statistiche` e `/admin/statistiche/report` · `/admin/contenuti/{faq,citta,blog,testi,recensioni}` · `/admin/impostazioni` · `/admin/utenti` · `/admin/registro` · `/admin/login` · `/admin/mfa`

Su mobile la barra inferiore ha 5 voci: Cruscotto, Richieste, Calendario, Flotta, Altro.

### 4.3 Pipeline delle richieste

| Fase | Codice | Si entra quando | Campi obbligatori per entrare | Si esce verso | Cosa succede in automatico |
|---|---|---|---|---|---|
| Nuova | `new` | Arriva dal sito o viene inserita a mano | Contatto con nome ed email o telefono | `working`, `quote_sent`, `lost` | Email di ricezione al cliente (solo sito), notifica al team, assegnazione, allerta SLA |
| In lavorazione | `working` | L'operatore la prende in carico | Assegnatario | `quote_sent`, `confirmed` (solo con pagamento o conferma del titolare), `lost` | — |
| Preventivo inviato | `quote_sent` | Il preventivo parte per email o WhatsApp | Auto, date di ritiro e riconsegna, totale | `working`, `confirmed` (solo con pagamento o conferma del titolare), `lost` | Promemoria di sollecito dopo 48 ore senza attività |
| Confermata | `confirmed` | Acconto pagato (webhook) o conferma manuale del titolare | Acconto `paid`, oppure nota del titolare | `on_rent`, `canceled` | Blocco nel calendario, email di conferma al cliente, promemoria ritiro 24 ore prima |
| In corso | `on_rent` | L'auto è stata consegnata | — | `completed` | Promemoria il giorno della riconsegna |
| Conclusa | `completed` | L'auto è stata riconsegnata | — | — | Promemoria per la richiesta di recensione dopo 24 ore |
| Persa | `lost` | L'operatore la chiude | Motivo (4.5); nota se "Altro" | `working` ("Riapri") | Rimozione di eventuali blocchi |
| Annullata | `canceled` | Il cliente rinuncia dopo la conferma | Nota (rimborsi gestiti in Stripe dall'azienda) | — | Rimozione del blocco |

`first_response_at` si registra alla prima comunicazione in uscita: email inviata, WhatsApp confermato o chiamata registrata.

### 4.4 Automazioni

Al cliente partono in automatico solo due messaggi: la conferma di ricezione e la conferma del pagamento. Tutto il resto lo prepara il sistema e lo invia l'operatore con un clic, così il tono resta personale.

| Quando | Cosa succede | Destinatario | Storia |
|---|---|---|---|
| Nuova richiesta dal sito | Email di ricezione; notifica; assegnazione | cliente, team | US-051, US-057 |
| Richiesta `new` oltre lo SLA, in orario di lavoro | Allerta, una sola volta | titolare | US-062 |
| `quote_sent` senza attività da 48 ore | Promemoria "Sollecito" | assegnatario | US-062 |
| Ogni giorno alle 8:00 (Europe/Rome) | Riepilogo di promemoria e richieste nuove | ogni operatore | US-062 |
| Link acconto non pagato da 12 ore | Promemoria "Ricorda l'acconto" con modello pronto | assegnatario | US-074 |
| Link scaduto | Promemoria "Rigenera il link" | assegnatario | US-074 |
| Acconto pagato | Fase `confirmed`, blocco nel calendario, email di conferma, notifica | cliente, team | US-072, US-079 |
| Pagamento su una richiesta persa o annullata | Allerta, nessun cambio di fase | titolare | US-072 |
| 24 ore prima del ritiro | Promemoria con bozza "Promemoria ritiro" | assegnatario | US-080 |
| Giorno della riconsegna | Promemoria | assegnatario | US-080 |
| 24 ore dopo `completed` | Promemoria con bozza "Richiesta recensione" | assegnatario | US-081 |
| Email rimbalzata | Promemoria "Verifica l'indirizzo email" | assegnatario | US-069 |
| Ogni giorno | Pulizia delle visite, anonimizzazione, backup, keep-alive | sistema | US-107, US-108 |

### 4.5 Motivi di perdita

| Codice | Etichetta |
|---|---|
| `price` | Prezzo |
| `unavailable` | Auto non disponibile nelle date |
| `security_deposit` | Cauzione troppo alta (D38) |
| `driver_requirements` | Requisiti del conducente (età, patente, carta) |
| `no_reply` | Nessuna risposta dal cliente |
| `competitor` | Ha scelto un altro noleggio |
| `changed_plans` | Ha cambiato programma |
| `invalid` | Richiesta non valida o spam |
| `other` | Altro (nota obbligatoria) |

---

## 5. Storie utente

| Epic | Storie | Fase del piano |
|---|---|---|
| A. Fondamenta tecniche | US-001 – US-005 | F2, settimana 3 |
| B. Database e permessi | US-006 – US-014 | F2, settimana 3 |
| C. Base dell'interfaccia | US-015 – US-018 | F2, settimana 3 |
| D. Accesso al pannello | US-019 – US-022 | F2, settimana 3 |
| E. Flotta | US-023 – US-028 | F2, settimana 3 |
| F. Sito pubblico | US-029 – US-044 | F2, settimana 4 |
| G. Richiesta di prenotazione | US-045 – US-051 | F2, settimana 4 → demo su staging |
| H. CRM: richieste e contatti | US-052 – US-064 | F3, settimane 5–6 |
| I. Messaggi | US-065 – US-069 | F3 |
| J. Pagamenti | US-070 – US-076 | F3 |
| K. Calendario | US-077 – US-079 | F3 |
| L. Dopo la conferma | US-080 – US-081 | F3 |
| M. Contenuti e impostazioni | US-082 – US-086 | F3 |
| N. Consenso e tracciamento | US-087 – US-094 | F4, settimane 7–8 |
| O. Statistiche | US-095 – US-097 | F4 |
| P. SEO e GEO | US-098 – US-104 | F5, settimane 9–10 |
| Q. Qualità e operazioni | US-105 – US-112 | F5 |

### Epic A — Fondamenta tecniche

#### US-001: Inizializzare il progetto
**Descrizione:** Come sviluppatore, voglio un progetto Next.js con controlli di qualità già attivi, così ogni storia parte dalle stesse regole.

**Criteri di accettazione:**
- [ ] Next.js (ultima versione stabile, App Router), React 19, TypeScript con `strict: true`, Tailwind CSS, ESLint e Prettier; versioni fissate e `package-lock.json` committato
- [ ] Script in `package.json`: `dev`, `build`, `typecheck` (`tsc --noEmit`), `lint`, `format`, `test`, `test:e2e`
- [ ] Cartelle come in sezione 9.3: `src/app`, `src/modules`, `src/components`, `src/lib`, `supabase/`, `content/`, `messages/`
- [ ] `.env.example` con tutte le variabili di sezione 9.8, senza valori reali; `.dev.vars` e i file `.env*` (tranne l'esempio) in `.gitignore`
- [ ] `docs/convenzioni.md` riassume comandi, cartelle e regole delle sezioni 0.1 e 9; `CLAUDE.md` lo importa con la riga `@docs/convenzioni.md`
- [ ] Typecheck e lint passano

#### US-002: Configurare i test
**Descrizione:** Come sviluppatore, voglio test unitari, end-to-end e di accessibilità pronti, così ogni storia può dimostrare di funzionare.

**Criteri di accettazione:**
- [ ] Vitest con un test di esempio su una funzione di `src/lib`; `npm test` termina con codice 0
- [ ] Playwright con due progetti: `mobile` (375×812) e `desktop` (1440×900); test di fumo che apre `/` e controlla il titolo
- [ ] `@axe-core/playwright` con un helper `expectNoA11yViolations(page)` che fallisce su violazioni "serious" e "critical"
- [ ] Workflow GitHub Actions `ci.yml`: typecheck, lint e test unitari a ogni push e pull request
- [ ] Typecheck e lint passano
- [ ] Test passano

#### US-003: Eseguire il sito su Cloudflare Workers
**Descrizione:** Come sviluppatore, voglio provare il sito nello stesso ambiente della produzione, così scopro subito i limiti della piattaforma.

**Criteri di accettazione:**
- [ ] Adattatore `@opennextjs/cloudflare` con `wrangler.jsonc` (flag `nodejs_compat`), binding R2 `PHOTOS`, binding Workers AI `AI`, cache incrementale su R2 come da documentazione OpenNext
- [ ] `npm run preview` avvia il sito in workerd e `/` risponde 200
- [ ] `next/image` usa un loader personalizzato (`src/lib/image-loader.ts`) che restituisce la variante pregenerata più vicina (sezione 9.5); nessuna ottimizzazione delle immagini a runtime
- [ ] `npm run check:worker-size` stampa la dimensione compressa del Worker e la confronta con i limiti dei piani Free e Paid (valori da verificare nella documentazione Cloudflare)
- [ ] Workflow `deploy.yml` avviabile a mano (`workflow_dispatch`) per staging e produzione, con i secret di GitHub; validato con `actionlint`
- [ ] `docs/deploy.md` descrive ambienti (due Worker, due progetti Supabase) e comandi
- [ ] Typecheck e lint passano

#### US-004: Collegare Supabase
**Descrizione:** Come sviluppatore, voglio un database locale e client tipizzati, così sviluppo e testo senza toccare la produzione.

**Criteri di accettazione:**
- [ ] `supabase init` eseguito; avvio locale con `supabase start` documentato in `docs/convenzioni.md` (richiede Docker)
- [ ] Client con `@supabase/ssr`: `createServerClient` basato sui cookie per pagine e pannello; `createAdminClient` con la chiave segreta in un file che importa `server-only`
- [ ] Un test scansiona `src/` e fallisce se trova la chiave segreta o il nome `SUPABASE_SECRET_KEY` in file eseguiti nel browser o in variabili `NEXT_PUBLIC_*`
- [ ] `npm run db:types` genera `src/lib/database.types.ts`
- [ ] Typecheck e lint passano
- [ ] Test passano

#### US-005: Log e monitoraggio errori
**Descrizione:** Come sviluppatore, voglio log strutturati e avvisi sugli errori, così so subito quando qualcosa si rompe.

**Criteri di accettazione:**
- [ ] Logger in `src/lib/logger.ts` con livelli e output JSON; rimuove email, telefoni, token e cookie dai messaggi (test)
- [ ] SDK Sentry compatibile con Workers (verificare `@sentry/nextjs` con OpenNext oppure `@sentry/cloudflare`); se `SENTRY_DSN` manca non fa nulla
- [ ] `sendDefaultPii` disattivato; corpo delle richieste e cookie esclusi dagli eventi
- [ ] Typecheck e lint passano
- [ ] Test passano

### Epic B — Database e permessi

Regole per tutte le migrazioni: file creati con `supabase migration new` (mai nomi inventati); RLS attiva su ogni tabella; `supabase db advisors` senza avvisi di sicurezza prima del commit; test pgTAP in `supabase/tests/`.

#### US-006: Migrazione staff, ruoli, impostazioni, registro e job
**Descrizione:** Come titolare, voglio ruoli e impostazioni nel database, così i permessi non dipendono dal codice dell'interfaccia.

**Criteri di accettazione:**
- [ ] Tabelle `staff_profiles`, `settings` (una sola riga, creata dalla migrazione con i valori di sezione 9.9), `audit_logs`, `job_runs` con i campi di sezione 9.4
- [ ] Funzioni `private.is_staff()` e `private.is_owner()` nello schema `private` (non esposto), `security definer` con `set search_path = ''`, basate su `auth.uid()` e `staff_profiles.is_active`. Il ruolo non si legge mai da `user_metadata`
- [ ] `settings`: lettura per lo staff; per `anon` solo le colonne pubbliche (permessi per colonna: ragione sociale, sede legale, P.IVA, telefono, WhatsApp, email pubblica, orari, tempo di risposta promesso); modifica solo per il titolare
- [ ] `audit_logs` leggibile solo dal titolare; nessuna policy di UPDATE o DELETE
- [ ] Funzione `audit()` in `src/modules/audit` che scrive nel registro dal server
- [ ] Test pgTAP: `anon` non legge `staff_profiles`, `audit_logs`, `job_runs`; un operatore non modifica `settings`; il titolare sì
- [ ] Typecheck e lint passano
- [ ] Test passano

#### US-007: Migrazione catalogo
**Descrizione:** Come operatore, voglio marche, categorie, partner, auto e foto nel database, così il catalogo si gestisce senza toccare il codice.

**Criteri di accettazione:**
- [ ] Tabelle `brands`, `categories`, `fleet_partners`, `vehicles`, `vehicle_images` con i campi di sezione 9.4; testi localizzati in colonne `jsonb` del tipo `{ "it": "...", "en": "..." }` con vincolo che `it` sia presente
- [ ] Importi in centesimi (`integer`): `price_from_cents` (nullo = "su richiesta"), `extra_km_cents`, `security_deposit_cents`; `km_included_per_day` predefinito 150 (D26)
- [ ] `vehicles.status` in `draft | published | archived`; `slug` unico; indici su `status`, `category_id`, `brand_id`
- [ ] `anon` legge solo auto `published` con le loro foto, marche e categorie; non può leggere `partner_id` né `internal_notes` (permessi per colonna); nessun accesso a `fleet_partners`
- [ ] Lo staff legge e scrive tutto
- [ ] Test pgTAP: `anon` non vede bozze, `partner_id` né partner
- [ ] Typecheck e lint passano
- [ ] Test passano

#### US-008: Migrazione calendario con blocco delle sovrapposizioni
**Descrizione:** Come operatore, voglio che il database impedisca due noleggi della stessa auto nello stesso periodo, così non confermo un'auto già impegnata.

**Criteri di accettazione:**
- [ ] Tabella `vehicle_blocks` con motivo `rental | maintenance | cleaning | transfer | other_rental | documents | other` e vincolo `ends_at > starts_at`
- [ ] Colonna `blocked_range` (`tstzrange`) calcolata da un trigger: per i blocchi `rental` aggiunge il margine `settings.rental_buffer_hours` (24, D22)
- [ ] Vincolo di esclusione con `btree_gist` che impedisce due blocchi `rental` sovrapposti sulla stessa auto
- [ ] Solo staff
- [ ] Test pgTAP: due noleggi sovrapposti → errore; noleggio che inizia 12 ore dopo un altro → errore; manutenzione sovrapposta a un noleggio → consentita
- [ ] Typecheck e lint passano
- [ ] Test passano

#### US-009: Migrazione contatti, richieste, attività, promemoria
**Descrizione:** Come operatore, voglio contatti e richieste in tabelle collegate, così ogni cliente ha uno storico unico.

**Criteri di accettazione:**
- [ ] Tabelle `contacts`, `requests`, `request_activities`, `tasks` con i campi di sezione 9.4
- [ ] `contacts.email` di tipo `citext`, `phone_e164` normalizzato; indici unici parziali su email e su telefono non nulli
- [ ] `requests.code` unico e leggibile (`VP-AAAA-NNNN`), generato da una sequenza
- [ ] `requests.stage` con i codici di 4.3, `lost_reason` con quelli di 4.5, `channel` con i valori del glossario; date e auto facoltative (le richieste inserite a mano possono non averle)
- [ ] Funzione `create_request_with_contact(...)` che in una sola transazione trova o crea il contatto (stessa email o stesso telefono), crea la richiesta e la prima attività
- [ ] Nessun accesso `anon`; lo staff legge e scrive; DELETE solo per il titolare
- [ ] Indici per l'inbox: `(stage, created_at desc)`, `(assigned_to, stage)`, `(pickup_at)`
- [ ] Test pgTAP: `anon` non legge né inserisce; la funzione riusa il contatto con la stessa email
- [ ] Typecheck e lint passano
- [ ] Test passano

#### US-010: Migrazione modelli, messaggi, pagamenti ed eventi Stripe
**Descrizione:** Come operatore, voglio messaggi e pagamenti salvati con la richiesta, così la cronologia è completa.

**Criteri di accettazione:**
- [ ] Tabelle `message_templates`, `messages`, `payments`, `stripe_events` con i campi di sezione 9.4
- [ ] `payments.kind` in `deposit | balance`; `status` in `link_created | paid | expired | failed | canceled`; `method` in `stripe | bank_transfer | cash | pos`
- [ ] `stripe_events.event_id` chiave primaria (idempotenza del webhook)
- [ ] Solo staff; righe di `payments` con `method <> 'stripe'` inseribili solo dal titolare
- [ ] Test pgTAP sui permessi
- [ ] Typecheck e lint passano
- [ ] Test passano

#### US-011: Migrazione contenuti
**Descrizione:** Come operatore, voglio FAQ, pagine città, articoli, testi e recensioni nel database, così li aggiorno dal pannello.

**Criteri di accettazione:**
- [ ] Tabelle `faqs`, `location_pages`, `blog_posts`, `testimonials`, `page_texts` con testi `jsonb` IT/EN e stato `draft | published`
- [ ] `testimonials` con fonte, data e conferma del consenso dell'autore obbligatori (NOT NULL)
- [ ] `anon` legge solo contenuti `published`; lo staff legge e scrive
- [ ] Test pgTAP
- [ ] Typecheck e lint passano
- [ ] Test passano

#### US-012: Migrazione visite, eventi, riassunti e consensi
**Descrizione:** Come titolare, voglio i dati di navigazione separati dai dati personali, così rispettiamo la privacy e possiamo cancellarli in automatico.

**Criteri di accettazione:**
- [ ] Tabelle `visit_sessions`, `visit_events`, `visit_summaries`, `consent_records` con i campi di sezione 9.4; nessuna colonna per IP, nome, email o telefono
- [ ] Indice su `visit_events (session_id, occurred_at)`
- [ ] Funzione `purge_old_visits(days int default 90)` che cancella le visite non collegate a richieste più vecchie di `days`
- [ ] Nessun accesso `anon` (le scritture passano dal server); lettura solo staff
- [ ] Test pgTAP: `purge_old_visits` conserva le visite collegate a una richiesta
- [ ] Typecheck e lint passano
- [ ] Test passano

#### US-013: Dati di prova
**Descrizione:** Come sviluppatore, voglio dati di prova realistici, così ogni pagina si può verificare senza i contenuti definitivi.

**Criteri di accettazione:**
- [ ] `supabase/seed.sql`: 3 marche; 4 categorie (SUV, Sportiva, Cabrio, Gran Turismo); 8 auto pubblicate con 3 foto segnaposto ciascuna, di cui 1 esclusiva; 1 bozza; 1 partner; un titolare e un operatore; 6 richieste in fasi diverse; i 7 modelli di US-066; 6 FAQ; 3 pagine città in bozza
- [ ] I testi segnaposto sono marcati `[NEED: ...]`; nessun dato inventato è presentato come reale
- [ ] `supabase db reset` carica il seed senza errori
- [ ] Typecheck e lint passano

#### US-014: Job programmati
**Descrizione:** Come sviluppatore, voglio un solo punto da cui partono i lavori periodici, così le automazioni sono affidabili e verificabili.

**Criteri di accettazione:**
- [ ] Route `POST /api/cron/[job]` che accetta solo l'header `Authorization: Bearer <CRON_SECRET>`; altrimenti risponde 401
- [ ] Un trigger ogni 10 minuti (Cron Trigger di Cloudflare tramite worker personalizzato di OpenNext; in alternativa GitHub Actions) chiama `/api/cron/tick`, che esegue i job in scadenza secondo `src/modules/jobs/registry.ts` (nome, frequenza, funzione)
- [ ] Ogni esecuzione registra inizio, fine, esito e durata in `job_runs`
- [ ] Un job che fallisce non blocca gli altri; l'errore va al logger e a Sentry
- [ ] Typecheck e lint passano
- [ ] Test passano (dispatcher con job finti: scadenze rispettate, errore isolato)

### Epic C — Base dell'interfaccia

#### US-015: Sito bilingue IT/EN
**Descrizione:** Come visitatore straniero, voglio il sito in inglese, così capisco offerta e condizioni (D33, D34).

**Criteri di accettazione:**
- [ ] `next-intl` con italiano alla radice e inglese sotto `/en`; percorsi tradotti come in 4.2
- [ ] Nessun reindirizzamento automatico in base alla lingua del browser o all'IP
- [ ] `<html lang="it">` o `lang="en"` corretto su ogni pagina
- [ ] Il selettore di lingua porta alla pagina equivalente, non alla home
- [ ] Testi dell'interfaccia in `messages/it.json` e `messages/en.json`; un test fallisce se una chiave manca in una delle due lingue
- [ ] Typecheck e lint passano
- [ ] Test passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-016: Controllo del CSS logico
**Descrizione:** Come sviluppatore, voglio che il layout usi solo proprietà logiche, così l'arabo in Fase 2 non richiede di rifare il CSS.

**Criteri di accettazione:**
- [ ] `npm run check:logical-css` fallisce se in `src/` trova classi Tailwind fisiche (`ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left`, `text-right`, `border-l`, `border-r`, `rounded-l`, `rounded-r`, `float-left`, `float-right`) o proprietà CSS fisiche equivalenti
- [ ] Il controllo gira dentro `npm run lint` e in CI
- [ ] Frecce e chevron passano da un componente `DirectionalIcon` che li specchia con `dir="rtl"`
- [ ] Typecheck e lint passano

#### US-017: Token del design system e font
**Prerequisito:** GATE-2.

**Descrizione:** Come designer, voglio che colori, caratteri e spaziature vengano da un'unica fonte, così il sito resta coerente.

**Criteri di accettazione:**
- [ ] Colori, tipografia, spaziature, raggi e ombre di `design-system/veloci-private/MASTER.md` definiti come variabili CSS e collegati al tema Tailwind; nessun colore esadecimale nei componenti
- [ ] Font self-hosted con `next/font/local` (nessuna richiesta a fonts.googleapis.com), sottoinsieme latino esteso, `font-display: swap`, peso totale ≤ 100 KB
- [ ] Un test verifica contrasto ≥ 4,5:1 per ogni coppia testo/sfondo del MASTER.md (≥ 3:1 per testo grande)
- [ ] `/dev/token` con colori e scala tipografica, disponibile solo in sviluppo
- [ ] `prefers-reduced-motion` gestito in modo globale: animazioni non essenziali a durata 0
- [ ] Typecheck e lint passano
- [ ] Test passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-018: Layout pubblico
**Descrizione:** Come visitatore, voglio telefono, WhatsApp e richiesta sempre a portata di mano, così contatto l'azienda nel modo che preferisco.

**Criteri di accettazione:**
- [ ] Header: logotipo testuale provvisorio finché non c'è un logo (D40); navigazione (Auto, Servizi, Firenze, FAQ, Contatti); telefono (`tel:`); WhatsApp (`wa.me`); pulsante "Richiedi la prenotazione". Numeri letti da `settings`
- [ ] Menu mobile: si apre e si chiude da tastiera, focus contenuto nel menu, `Esc` chiude, aree di tocco ≥ 44×44 px
- [ ] Footer: dati aziendali obbligatori da `settings` (ragione sociale, sede legale, P.IVA), link a privacy, cookie, termini, preferenze cookie, pagine città e marche
- [ ] Link "Salta al contenuto"; focus visibile su ogni elemento interattivo
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

### Epic D — Accesso al pannello

#### US-019: Login e protezione di /admin
**Descrizione:** Come operatore, voglio entrare nel pannello con le mie credenziali, così solo lo staff vede i dati dei clienti.

**Criteri di accettazione:**
- [ ] `/admin/login` con email e password (Supabase Auth); il messaggio d'errore non rivela se l'email esiste
- [ ] Senza sessione, ogni pagina `/admin/*` porta al login; dopo il login si torna alla pagina richiesta
- [ ] Entrano solo gli utenti con `staff_profiles.is_active = true`; gli altri vedono "Account non abilitato"
- [ ] Logout dal menu utente
- [ ] Helper `requireStaff()` e `requireOwner()` usati all'inizio di ogni server action e route del pannello, con test
- [ ] Typecheck e lint passano
- [ ] Test passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-020: Secondo fattore obbligatorio
**Descrizione:** Come titolare, voglio il secondo fattore per tutti, così una password rubata non basta per entrare.

**Criteri di accettazione:**
- [ ] Al primo accesso l'utente registra un'app di autenticazione (TOTP) con QR code e codice di verifica
- [ ] Senza secondo fattore verificato (livello `aal2`) le pagine `/admin/*` portano a `/admin/mfa`
- [ ] Il titolare può azzerare il secondo fattore di un operatore; l'azione finisce in `audit_logs`
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-021: Struttura del pannello e installazione sul telefono
**Descrizione:** Come operatore, voglio un pannello comodo anche dal telefono, così rispondo ai clienti quando sono fuori.

**Criteri di accettazione:**
- [ ] Desktop: barra laterale con Cruscotto, Richieste, Contatti, Calendario, Flotta, Modelli, Visitatori, Statistiche, Contenuti; Impostazioni, Utenti e Registro solo per il titolare
- [ ] Mobile: barra inferiore con Cruscotto, Richieste, Calendario, Flotta, Altro
- [ ] Interfaccia in italiano, densità alta, stili del MASTER.md per le superfici "Operare"
- [ ] `manifest.webmanifest` con nome, icone 192 e 512 px, `display: standalone`, `start_url: /admin`: il pannello si aggiunge alla schermata Home
- [ ] Una pagina con titolo per ogni voce; i contenuti arrivano nelle storie successive
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-022: Gestione utenti
**Descrizione:** Come titolare, voglio invitare e disattivare operatori, così controllo chi accede ai dati.

**Criteri di accettazione:**
- [ ] `/admin/utenti` (solo titolare): elenco, invito via email con ruolo, disattivazione, cambio di ruolo
- [ ] Un operatore che apre la pagina riceve 403
- [ ] Non si può disattivare l'ultimo titolare attivo
- [ ] Ogni modifica finisce in `audit_logs`
- [ ] Typecheck e lint passano
- [ ] Test passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

### Epic E — Flotta

#### US-023: Elenco auto
**Descrizione:** Come operatore, voglio vedere tutta la flotta in una pagina, così so cosa è pubblicato e cosa manca.

**Criteri di accettazione:**
- [ ] `/admin/flotta`: tabella con foto di copertina, marca e modello, categoria, prezzo "da", stato, badge, partner
- [ ] Filtri per stato e categoria; ricerca per nome
- [ ] Su mobile, elenco a schede
- [ ] Stato vuoto con pulsante "Aggiungi la prima auto"
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-024: Creare e modificare un'auto
**Descrizione:** Come operatore, voglio inserire un'auto con prezzi, condizioni e specifiche, così compare nel catalogo senza chiedere allo sviluppatore.

**Criteri di accettazione:**
- [ ] Modulo con tutti i campi di `vehicles` (sezione 9.4); schema Zod condiviso tra browser e server; errore accanto al campo
- [ ] Slug generato da marca e modello, modificabile e unico (errore chiaro se esiste già)
- [ ] Prezzi inseriti in euro e salvati in centesimi
- [ ] Campi SEO IT/EN con contatore di caratteri (indicativo: 60 per il titolo, 155 per la descrizione)
- [ ] Server action con `requireStaff()`; ogni modifica finisce in `audit_logs`
- [ ] Typecheck e lint passano
- [ ] Test passano (schema Zod)
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-025: Foto su R2 con varianti ottimizzate
**Descrizione:** Come operatore, voglio trascinare le foto e trovarle già ottimizzate, così il sito resta veloce anche con molte immagini.

**Criteri di accettazione:**
- [ ] Caricamento multiplo con trascinamento; nel browser ogni foto diventa WebP in 4 larghezze (640, 1024, 1600, 2400 px; mai ingrandita) prima dell'invio
- [ ] Il server controlla tipo e peso (massimo 8 MB per variante), salva su R2 con chiavi `vehicles/<id>/<uuid>-<larghezza>.webp` e registra larghezza e altezza
- [ ] Le foto sono servite dal dominio immagini (sezione 9.5) con `Cache-Control: public, max-age=31536000, immutable`
- [ ] Barra di avanzamento e messaggio chiaro per i file non validi
- [ ] Typecheck e lint passano
- [ ] Test passano (controllo dei file)
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-026: Ordine, copertina e testo alternativo delle foto
**Descrizione:** Come operatore, voglio scegliere l'ordine e la foto principale, così ogni scheda si apre con l'immagine migliore.

**Criteri di accettazione:**
- [ ] Ordinamento con trascinamento e, come alternativa accessibile, pulsanti "Su" e "Giù"
- [ ] Una sola foto di copertina per auto
- [ ] Testo alternativo IT obbligatorio per pubblicare; EN consigliato (avviso se manca)
- [ ] Eliminazione con conferma; cancella anche i file su R2
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-027: Pubblicazione, badge e aggiornamento del sito
**Descrizione:** Come operatore, voglio pubblicare o nascondere un'auto e metterla in evidenza, così il sito mostra solo quello che possiamo noleggiare.

**Criteri di accettazione:**
- [ ] Stati Bozza, Pubblicata, Archiviata; per pubblicare servono copertina, descrizione IT e testi alternativi IT (il prezzo "da" può mancare solo per le auto esclusive)
- [ ] Badge: In evidenza, In arrivo, Esclusiva su richiesta, Disponibilità limitata (D67)
- [ ] Dopo ogni modifica le pagine pubbliche interessate si aggiornano entro 1 minuto (`revalidateTag` su `vehicles` e `vehicle:<slug>`)
- [ ] La scheda di un'auto archiviata reindirizza (301) al catalogo filtrato sulla sua categoria
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-028: Partner della flotta
**Descrizione:** Come operatore, voglio sapere di quale partner è ogni auto, così chiamo la persona giusta per verificare la disponibilità (D19).

**Criteri di accettazione:**
- [ ] `/admin/flotta/partner`: elenco, creazione e modifica (nome, referente, telefono, email, note)
- [ ] Nella scheda auto si sceglie il partner
- [ ] Il partner non compare mai nel sito pubblico (test sul codice HTML della scheda auto)
- [ ] Typecheck e lint passano
- [ ] Test passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

### Epic F — Sito pubblico

#### US-029: Modulo catalog
**Descrizione:** Come sviluppatore, voglio un solo modulo per leggere il catalogo, così tutte le pagine mostrano gli stessi dati.

**Criteri di accettazione:**
- [ ] `src/modules/catalog` con `listVehicles(filters, locale)`, `getVehicleBySlug(slug, locale)`, `listBrands()`, `listCategories()`, `listSimilar(vehicle)`; solo auto pubblicate, tramite il client `anon`
- [ ] Deduplicazione per richiesta con `React.cache`; dati in cache con i tag `vehicles` e `vehicle:<slug>`
- [ ] Filtri: categoria, marca, prezzo massimo, posti minimi, cambio
- [ ] Ai componenti arrivano solo i campi che mostrano
- [ ] Typecheck e lint passano
- [ ] Test passano (filtri sui dati di prova)

#### US-030: Card auto
**Descrizione:** Come visitatore, voglio capire in un colpo d'occhio auto, prezzo e prestazioni, così scelgo quale aprire.

**Criteri di accettazione:**
- [ ] Foto di copertina con rapporto fisso e `width`/`height` dichiarati; marca e modello; categoria; "da X €/giorno"; CV, 0–100 e velocità massima; badge
- [ ] Varianti esplicite (`VehicleCard`, `VehicleCardFeatured`), senza prop booleane per cambiare aspetto
- [ ] L'intera card è un solo link con nome accessibile chiaro
- [ ] Prezzo formattato con `Intl.NumberFormat` nella lingua della pagina
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-031: Catalogo con filtri
**Descrizione:** Come visitatore, voglio filtrare la flotta, così trovo in fretta l'auto adatta a me.

**Criteri di accettazione:**
- [ ] `/auto` e `/en/cars` mostrano le auto pubblicate, rese lato server
- [ ] Filtri (categoria, marca, fascia di prezzo, posti, cambio) nei parametri dell'URL: un link condiviso mostra lo stesso risultato
- [ ] Le pagine filtrate hanno canonical alla pagina senza filtri e `noindex, follow`
- [ ] Stato vuoto: "Nessuna auto con questi filtri", pulsante per togliere i filtri e link WhatsApp
- [ ] Filtri usabili da tastiera e con lettore di schermo; su mobile in un pannello a comparsa
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-032: Scheda auto — contenuti, prezzo, condizioni
**Descrizione:** Come visitatore, voglio leggere prezzo e condizioni prima di chiedere, così so già quanto costa e cosa serve (D24–D28, D30).

**Criteri di accettazione:**
- [ ] `/auto/[slug]` e `/en/cars/[slug]`; 404 se l'auto non è pubblicata
- [ ] H1 con marca e modello; foto principale con `fetchpriority="high"`
- [ ] "A partire da X €/giorno" con la nota "bassa stagione; alta stagione su richiesta"; "Su richiesta" se il prezzo manca
- [ ] Blocco condizioni: km inclusi al giorno, costo dei km extra, cauzione indicativa, età minima e anni di patente
- [ ] Specifiche: CV, 0–100, velocità massima, motore, posti, cambio
- [ ] Link alla pagina della cauzione (D38)
- [ ] "Richiedi la prenotazione" apre il modulo con l'auto già scelta
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-033: Scheda auto — galleria
**Descrizione:** Come visitatore, voglio sfogliare le foto a schermo intero, così vedo l'auto nei dettagli.

**Criteri di accettazione:**
- [ ] Galleria a schermo intero: swipe su mobile; frecce e tasti ←/→ su desktop; `Esc` chiude e il focus torna al pulsante che l'ha aperta
- [ ] Immagini con `srcset` e `sizes` dalle varianti WebP; `loading="lazy"` per quelle fuori schermo
- [ ] Avanti e indietro con transizione direzionale (View Transitions); nessuna animazione con `prefers-reduced-motion`
- [ ] Contatore "3 di 12" letto dal lettore di schermo
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-034: Scheda auto — barra mobile, WhatsApp, auto simili
**Descrizione:** Come visitatore da telefono, voglio richiedere o scrivere su WhatsApp senza risalire la pagina, così non perdo tempo.

**Criteri di accettazione:**
- [ ] Su mobile, barra fissa in basso con "Richiedi la prenotazione" e WhatsApp; non copre contenuti (spazio riservato in fondo) e rispetta `env(safe-area-inset-bottom)`
- [ ] Il link WhatsApp apre `wa.me/<numero>` con il testo "Ciao, vorrei informazioni su <auto>" nella lingua della pagina
- [ ] Sezione "Auto simili": fino a 3 auto della stessa categoria o fascia di prezzo
- [ ] Transizione condivisa dell'immagine dalla card del catalogo alla scheda (View Transitions), disattivata con `prefers-reduced-motion`
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-035: Home — hero e ricerca rapida
**Descrizione:** Come visitatore, voglio capire subito cosa offre VELOCI PRIVATE e cercare per date, così arrivo alle auto giuste.

**Criteri di accettazione:**
- [ ] Hero con foto o video reale della flotta. Video: muto, senza audio, poster come immagine LCP, peso ≤ 2,5 MB, non parte con `prefers-reduced-motion` né con `Save-Data`
- [ ] Titolo, sottotitolo e CTA presi da `page_texts` (testi approvati, sezione 8.5)
- [ ] Ricerca rapida: date di ritiro e riconsegna e categoria → catalogo filtrato; le date passano al modulo di richiesta
- [ ] Un solo momento animato all'apertura della pagina; nessuna animazione d'ingresso ripetuta sulle sezioni
- [ ] LCP ≤ 2,5 s in Lighthouse mobile
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-036: Home — sezioni
**Descrizione:** Come visitatore, voglio vedere le auto migliori e come funziona il noleggio, così mi fido abbastanza da richiedere.

**Criteri di accettazione:**
- [ ] Auto con badge "In evidenza" e link al catalogo
- [ ] "Come funziona" in 3 passi reali: richiesta → conferma con link per l'acconto → consegna in aeroporto, hotel o indirizzo (D20, D42)
- [ ] Servizi; blocco breve sulla cauzione con link alla pagina dedicata; 4 FAQ; CTA finale
- [ ] La sezione recensioni compare solo se esistono recensioni pubblicate (mai segnaposto in produzione)
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-037: Pagina della cauzione
**Descrizione:** Come visitatore, voglio sapere quanto è la cauzione e come funziona, così il deposito non mi blocca (D38).

**Criteri di accettazione:**
- [ ] `/come-funziona-la-cauzione` e `/en/security-deposit`: importi da 5.000 a 30.000 € secondo l'auto, come si versa al ritiro, quando si sblocca [NEED: regole dell'azienda] (D28, D50)
- [ ] Tabella auto → cauzione indicativa generata dai dati della flotta
- [ ] Differenza esplicita tra acconto (20%, online) e cauzione (al ritiro)
- [ ] Domande come H2, ognuna seguita da una risposta autonoma di 40–60 parole
- [ ] Data "Aggiornato il" visibile
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-038: Pagina FAQ
**Descrizione:** Come visitatore, voglio risposte rapide su pagamenti, requisiti e consegna, così non devo scrivere per ogni dubbio.

**Criteri di accettazione:**
- [ ] `/faq` e `/en/faq` con le FAQ pubblicate, raggruppate per categoria: Richiesta, Pagamenti e acconto, Cauzione, Requisiti del conducente, Consegna e ritiro
- [ ] Domande con `<details>`/`<summary>`, leggibili anche senza JavaScript
- [ ] JSON-LD `FAQPage` con le stesse domande e risposte visibili
- [ ] Typecheck e lint passano
- [ ] Test passano (JSON-LD uguale al contenuto visibile)
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-039: Auto esclusive
**Descrizione:** Come visitatore, voglio vedere le auto più rare, così so che posso chiedere anche quelle (D35, D67).

**Criteri di accettazione:**
- [ ] Sezione in home e pagina `/auto-esclusive` (`/en/exclusive-cars`) con le auto con badge "Esclusiva su richiesta"
- [ ] Prezzo "Su richiesta" quando il prezzo "da" non è impostato
- [ ] Badge "Disponibilità limitata" dove impostato
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-040: Servizi, chi siamo, contatti
**Descrizione:** Come visitatore, voglio sapere dove consegnate e come contattarvi, così organizzo il noleggio.

**Criteri di accettazione:**
- [ ] `/servizi`: consegna negli aeroporti di Firenze e Pisa, in hotel o a un indirizzo; autista tramite soggetti abilitati; eventi, matrimoni, produzioni e tour (D10). Ogni servizio ha una CTA verso il modulo
- [ ] `/chi-siamo` con testi da `page_texts` [NEED: storia e persone]
- [ ] `/contatti`: telefono, WhatsApp, email e orari; nessun indirizzo di ritiro (servizio su appuntamento, D6) e zona servita esplicita
- [ ] Versioni EN di tutte e tre
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-041: Pagine legali e di errore
**Descrizione:** Come visitatore, voglio leggere privacy e condizioni e non finire mai in una pagina vuota, così mi fido del sito.

**Criteri di accettazione:**
- [ ] `/privacy`, `/cookie`, `/termini` e versioni EN con i testi di `page_texts` forniti dal consulente; finché mancano, la pagina dice "Testo in preparazione" e ha `noindex`
- [ ] Pagine 404 e 500 IT/EN con link a catalogo, contatti e WhatsApp
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-042: Pagine marca
**Descrizione:** Come visitatore che cerca una marca precisa, voglio una pagina con tutte le sue auto, così le confronto.

**Criteri di accettazione:**
- [ ] `/marche/[marca]` e `/en/brands/[brand]`: introduzione della marca da `brands`, auto della marca, link alle categorie
- [ ] La pagina esiste solo se la marca ha almeno un'auto pubblicata; altrimenti 404
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-043: Pagine città e aeroporti
**Descrizione:** Come visitatore che atterra a Firenze o Pisa, voglio sapere come avviene la consegna lì, così prenoto senza sorprese.

**Criteri di accettazione:**
- [ ] Pagine da `location_pages` pubblicate: Firenze, Aeroporto di Firenze, Aeroporto di Pisa (slug in 4.2)
- [ ] Campi strutturati: dove avviene la consegna, preavviso, costi di consegna, esempi d'uso, FAQ locali, auto consigliate [NEED: dati reali dall'azienda]
- [ ] Nessun indirizzo inventato; frase esplicita "Servizio su appuntamento a <zona>" (sezione 8.6)
- [ ] Una pagina con campi obbligatori vuoti non si pubblica (niente pagine fotocopia)
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-044: Blog
**Descrizione:** Come visitatore, voglio articoli utili su requisiti, cauzione e zone, così trovo risposte prima di noleggiare (D14).

**Criteri di accettazione:**
- [ ] `/blog` e `/blog/[slug]` (+ EN) con articoli pubblicati: autore, data di pubblicazione e di aggiornamento, immagine di copertina
- [ ] Markdown convertito in HTML sicuro (sanitizzato)
- [ ] Indice dei contenuti per gli articoli con più di 3 H2
- [ ] Link interni verso le schede auto e le pagine città citate
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

### Epic G — Richiesta di prenotazione

#### US-045: Schema della richiesta (TDD)
**Descrizione:** Come sviluppatore, voglio le regole della richiesta in un solo schema, così browser e server controllano le stesse cose.

**Criteri di accettazione:**
- [ ] `src/modules/requests/schema.ts` con Zod, condiviso tra browser e server
- [ ] Regole: ritiro almeno `settings.min_lead_hours` (24) dopo l'invio; riconsegna dopo il ritiro; durata tra 1 e `settings.max_rental_days` (90, D51) giorni; email valida; telefono convertito in E.164 con `libphonenumber-js`; nome obbligatorio; consenso privacy obbligatorio; consenso marketing separato e facoltativo
- [ ] Luogo: `airport_flr | airport_psa | hotel | address | other`; indirizzo obbligatorio per `hotel`, `address` e `other`
- [ ] Messaggi d'errore IT/EN per ogni regola
- [ ] Un test per ogni regola, scritto prima del codice
- [ ] Typecheck e lint passano
- [ ] Test passano

#### US-046: Salvataggio della richiesta
**Descrizione:** Come cliente, voglio che la mia richiesta arrivi all'azienda con tutti i dettagli, così non devo ripeterli.

**Criteri di accettazione:**
- [ ] Server action `submitBookingRequest` in `src/modules/requests`: valida con lo schema, chiama `create_request_with_contact` e restituisce il codice
- [ ] Canale `website`; lingua del contatto uguale a quella della pagina; auto facoltativa ("Consigliatemi voi")
- [ ] Se c'è il cookie di sessione statistica (solo con consenso), salva `visit_session_id`
- [ ] Errori restituiti per campo; nessun dettaglio tecnico al cliente; errore inviato a Sentry
- [ ] Typecheck e lint passano
- [ ] Test passano (contatto riusato, auto assente, dati non validi)

#### US-047: Protezione anti-spam
**Descrizione:** Come operatore, voglio ricevere solo richieste vere, così non perdo tempo con lo spam.

**Criteri di accettazione:**
- [ ] Cloudflare Turnstile invisibile, verificato sul server prima del salvataggio
- [ ] Campo nascosto anti-bot: se è compilato, il server risponde con un finto successo e non salva nulla
- [ ] Al massimo 5 invii per IP all'ora (binding Rate Limiting di Cloudflare o contatore equivalente); l'IP non finisce nel database
- [ ] Oltre il limite, messaggio chiaro con link WhatsApp
- [ ] Typecheck e lint passano
- [ ] Test passano

#### US-048: Modulo, passo 1 — il noleggio
**Descrizione:** Come cliente, voglio indicare auto, date e luogo in pochi tocchi, così la richiesta è completa (D43).

**Criteri di accettazione:**
- [ ] Componente `BookingRequestForm` usato nella scheda auto, in `/richiedi` e nelle pagine città
- [ ] Passo 1 "Il noleggio": auto (già scelta o "Consigliatemi voi"); data e ora di ritiro e di riconsegna; luogo di consegna e di riconsegna, con indirizzo quando serve; km previsti; secondo conducente; extra (assicurazione aggiuntiva, autista); note
- [ ] Etichette sempre visibili; controllo all'uscita dal campo; errore accanto al campo; indicatore "Passo 1 di 2"
- [ ] Date e ore con controlli nativi accessibili, fuso Europe/Rome
- [ ] Attributi `data-track` su passi e campi, letti dal tracciamento (US-089) senza leggere i valori
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-049: Modulo, passo 2 — contatti e invio
**Descrizione:** Come cliente, voglio lasciare i miei recapiti e sapere cosa succede dopo, così invio la richiesta con fiducia.

**Criteri di accettazione:**
- [ ] Passo 2 "I tuoi contatti": nome, email, telefono con prefisso internazionale, canale preferito (email, telefono, WhatsApp), consenso privacy con link, consenso marketing separato e non preselezionato
- [ ] Riepilogo prima dell'invio; si torna al passo 1 senza perdere i dati
- [ ] Bozza salvata in `sessionStorage` con chiave versionata e cancellata dopo l'invio
- [ ] Widget Turnstile; pulsante "Invia la richiesta" con stato di caricamento; un doppio clic non crea due richieste
- [ ] Sotto il pulsante: "Ti rispondiamo <tempo promesso da settings>. L'acconto si paga solo dopo la nostra conferma."
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px (invio completo da mobile)

#### US-050: Pagina di conferma e pagina "Richiedi"
**Descrizione:** Come cliente, voglio una conferma chiara con il codice della richiesta, così so che è arrivata.

**Criteri di accettazione:**
- [ ] `/richiesta-inviata` (`noindex`): codice, riepilogo, tempi di risposta, 3 passi successivi, link WhatsApp
- [ ] `/richiedi` e `/en/request`: modulo senza auto preselezionata
- [ ] Evento `request_submitted` disponibile per tracciamento e tag (US-089, US-094)
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-051: Email automatiche di ricezione
**Descrizione:** Come cliente, voglio un'email di conferma; come operatore, voglio una notifica immediata, così nessuna richiesta resta ferma.

**Criteri di accettazione:**
- [ ] Adattatore email in `src/modules/messaging/email` con implementazione Resend (via `fetch`) e implementazione finta per i test
- [ ] Dopo il salvataggio, con `after()`: al cliente conferma nella sua lingua con riepilogo e codice, mittente `preventivi@<dominio>` e risposta alla casella aziendale; al team notifica con link alla scheda richiesta
- [ ] Ogni valore inserito dal cliente è escapato nell'HTML (test con `<script>` nel nome)
- [ ] Ogni invio registrato in `messages`; se Resend fallisce, la richiesta resta salvata e l'errore va a Sentry
- [ ] Typecheck e lint passano
- [ ] Test passano

### Epic H — CRM: richieste e contatti

#### US-052: Pipeline delle fasi (TDD)
**Descrizione:** Come titolare, voglio regole fisse sui passaggi di fase, così i dati del CRM sono affidabili.

**Criteri di accettazione:**
- [ ] `src/modules/requests/pipeline.ts` con `canTransition(from, to, ctx)` e `transition(request, to, input)` secondo la tabella 4.3
- [ ] `quote_sent` richiede auto, date e totale; `lost` richiede il motivo (e la nota se "Altro"); `confirmed` solo con acconto pagato o conferma manuale del titolare; `canceled` solo da `confirmed` con nota
- [ ] `first_response_at` impostato alla prima comunicazione in uscita
- [ ] Ogni passaggio crea un'attività `stage_changed` e aggiorna `stage_changed_at`
- [ ] Un test per ogni passaggio consentito e uno per ogni passaggio vietato, scritti prima del codice
- [ ] Typecheck e lint passano
- [ ] Test passano

#### US-053: Inbox delle richieste
**Descrizione:** Come operatore, voglio vedere subito le richieste nuove e quelle che aspettano, così rispondo in tempo.

**Criteri di accettazione:**
- [ ] `/admin/richieste`: schede per fase con contatore; colonne codice, cliente, auto, date, canale, assegnatario, "arrivata X min fa"
- [ ] Il tempo d'attesa diventa rosso oltre `settings.first_response_sla_minutes`, contato solo negli orari di lavoro
- [ ] Filtri (fase, canale, operatore, auto, periodo) nei parametri dell'URL; ordine: le nuove per arrivo, le altre per data di ritiro
- [ ] Paginazione lato server da 50
- [ ] Su mobile, elenco a schede
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-054: Vista pipeline
**Descrizione:** Come titolare, voglio vedere quante richieste ci sono in ogni fase, così capisco dove si bloccano.

**Criteri di accettazione:**
- [ ] Interruttore Elenco / Pipeline; una colonna per fase aperta con contatore e valore stimato totale
- [ ] Spostamento con il menu "Sposta in…" della card, usabile da tastiera; applica le regole di US-052 e chiede i campi mancanti
- [ ] Richieste ferme nella stessa fase da più di `settings.stale_days` (3) giorni segnalate
- [ ] Nessuna animazione sugli spostamenti
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-055: Scheda richiesta
**Descrizione:** Come operatore, voglio tutto su una richiesta in una pagina, così rispondo senza cercare altrove.

**Criteri di accettazione:**
- [ ] `/admin/richieste/[codice]`: dati della richiesta; contatto con link `tel:` e WhatsApp; auto; fonte; assegnatario; fase
- [ ] Cronologia di attività, messaggi, pagamenti e note, dalla più recente
- [ ] Note interne con autore e data
- [ ] Avviso se l'auto ha blocchi nel periodo richiesto
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-056: Preventivo e cambio di fase
**Descrizione:** Come operatore, voglio scrivere il preventivo e cambiare fase dalla scheda, così il CRM riflette la trattativa.

**Criteri di accettazione:**
- [ ] Sezione "Preventivo": totale IVA inclusa, km inclusi, extra compresi, note; il salvataggio non cambia fase
- [ ] Pulsanti per i soli passaggi consentiti; i campi obbligatori si chiedono in un dialogo
- [ ] "Segna come persa": motivo da 4.5 e nota; "Riapri" riporta a `working`
- [ ] "Conferma manuale" visibile solo al titolare, con nota obbligatoria
- [ ] Errori della pipeline mostrati in italiano chiaro
- [ ] Typecheck e lint passano
- [ ] Test passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-057: Assegnazione
**Descrizione:** Come titolare, voglio che ogni richiesta abbia subito un responsabile, così nessuno pensa che se ne occupi un altro.

**Criteri di accettazione:**
- [ ] Alla creazione, assegnazione secondo `settings.assignment_mode`: `round_robin` tra operatori attivi (predefinito), `fixed` a una persona, `none`; se nessuno è disponibile, al titolare
- [ ] Riassegnazione manuale dalla scheda
- [ ] Email all'assegnatario con link alla richiesta; attività `assigned` nella cronologia
- [ ] Typecheck e lint passano
- [ ] Test passano (round robin con 2 operatori; operatore disattivato saltato)
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-058: Richiesta inserita a mano
**Descrizione:** Come operatore, voglio registrare le richieste arrivate da WhatsApp, telefono, Instagram o hotel, così tutto sta nel CRM (D57).

**Criteri di accettazione:**
- [ ] Pulsante "Nuova richiesta" nell'inbox; canale obbligatorio tra WhatsApp, telefono, Instagram, email, hotel/concierge, partner, marketplace, altro; campo libero per il dettaglio (es. nome dell'hotel)
- [ ] Ricerca del contatto per nome, email o telefono; se non esiste si crea; avviso di possibile duplicato
- [ ] Stessa validazione del sito, ma in fase `new` auto e date possono mancare
- [ ] Typecheck e lint passano
- [ ] Test passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-059: Contatti
**Descrizione:** Come operatore, voglio lo storico di ogni persona, così riconosco un cliente che torna.

**Criteri di accettazione:**
- [ ] `/admin/contatti`: elenco con ricerca, numero di richieste, ultima attività, lingua, consenso marketing
- [ ] Scheda contatto: dati, consensi con data, richieste, note; dati modificabili
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-060: Unione dei duplicati
**Descrizione:** Come titolare, voglio unire due contatti della stessa persona, così lo storico non si divide.

**Criteri di accettazione:**
- [ ] Segnalazione dei contatti con stessa email o stesso telefono normalizzato
- [ ] "Unisci" (solo titolare): scelto il contatto da tenere, richieste e attività passano a quello e l'altro si cancella; azione in `audit_logs`
- [ ] Il consenso marketing che resta è il più recente dei due
- [ ] Typecheck e lint passano
- [ ] Test passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-061: Promemoria e registrazione dei contatti
**Descrizione:** Come operatore, voglio annotare chiamate e cose da fare, così ricontatto i clienti al momento giusto.

**Criteri di accettazione:**
- [ ] Dalla scheda richiesta: nuovo promemoria con tipo, scadenza, assegnatario e nota (es. "Richiamare giovedì")
- [ ] "Registra contatto" (chiamata, WhatsApp, Instagram, email esterna) con esito e, se serve, promemoria successivo
- [ ] Vista "Da fare oggi" con promemoria scaduti e di oggi, nel cruscotto e in `/admin/richieste?vista=oggi`
- [ ] "Fatto" e "Rimanda di un giorno" con un clic
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-062: Automazioni del CRM
**Descrizione:** Come titolare, voglio avvisi automatici quando una richiesta aspetta troppo, così non perdiamo clienti per lentezza.

**Criteri di accettazione:**
- [ ] Ogni 10 minuti: richiesta `new` oltre lo SLA negli orari di lavoro → email di allerta al titolare, una sola volta
- [ ] Ogni ora: richiesta `quote_sent` senza attività da 48 ore → promemoria "Sollecito" all'assegnatario
- [ ] Ogni giorno alle 8:00 (Europe/Rome): riepilogo a ogni operatore con promemoria del giorno e richieste nuove
- [ ] Ogni automazione registra un'attività e non si ripete per lo stesso evento (`tasks.dedupe_key`)
- [ ] Typecheck e lint passano
- [ ] Test passano (orologio fisso)

#### US-063: Ricerca globale
**Descrizione:** Come operatore, voglio trovare una richiesta dal nome o dal telefono, così rispondo subito a chi chiama.

**Criteri di accettazione:**
- [ ] Campo di ricerca nell'intestazione del pannello: codice, nome, email, telefono, auto
- [ ] Scorciatoia `/` su desktop; risultati raggruppati (Richieste, Contatti, Auto) navigabili con le frecce
- [ ] Risposta entro 300 ms sui dati di prova (indice trigram o ricerca testuale in Postgres)
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-064: Esportazione CSV
**Descrizione:** Come titolare, voglio esportare richieste e contatti, così posso fare analisi e campagne con altri strumenti (D60).

**Criteri di accettazione:**
- [ ] Solo titolare: richieste (con i filtri attivi) e contatti in CSV UTF-8 con separatore `;`
- [ ] Variante "Solo contatti con consenso marketing" per la riattivazione dei clienti
- [ ] Ogni esportazione in `audit_logs`
- [ ] Typecheck e lint passano
- [ ] Test passano (`;`, virgolette e a capo gestiti; celle che iniziano con `=`, `+`, `-` o `@` neutralizzate)
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

### Epic I — Messaggi

#### US-065: Segnaposto dei modelli (TDD)
**Descrizione:** Come operatore, voglio modelli che si compilano da soli, così ogni risposta è veloce e senza errori.

**Criteri di accettazione:**
- [ ] `renderTemplate(template, context)` in `src/modules/messaging` con i segnaposto `{{nome}}`, `{{codice}}`, `{{auto}}`, `{{data_ritiro}}`, `{{data_riconsegna}}`, `{{luogo}}`, `{{prezzo_totale}}`, `{{acconto}}`, `{{saldo}}`, `{{link_acconto}}`, `{{scadenza_link}}`, `{{operatore}}`, `{{telefono_azienda}}`
- [ ] Date e importi formattati nella lingua del contatto
- [ ] Segnaposto sconosciuto → errore al salvataggio del modello; segnaposto senza valore → errore prima dell'invio
- [ ] Versione HTML con valori escapati e versione testo per WhatsApp
- [ ] Test scritti prima del codice
- [ ] Typecheck e lint passano
- [ ] Test passano

#### US-066: Gestione dei modelli
**Descrizione:** Come operatore, voglio creare e modificare i modelli, così le risposte seguono lo stile dell'azienda.

**Criteri di accettazione:**
- [ ] `/admin/modelli`: elenco per canale (email, WhatsApp) e lingua; crea, modifica, duplica, disattiva
- [ ] Tipo del modello: `quote`, `unavailable`, `documents`, `follow_up`, `deposit_reminder`, `pickup_reminder`, `review_request`, `generic`
- [ ] Editor con anteprima su una richiesta di prova; segnaposto inseriti da un menu
- [ ] Modelli iniziali (testi in 8.5): Preventivo con link acconto, Auto non disponibile con alternativa, Richiesta documenti, Sollecito dopo 48 ore, Promemoria acconto, Promemoria ritiro, Richiesta recensione
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-067: Invio email dal pannello
**Descrizione:** Come operatore, voglio rispondere via email dal pannello, così la conversazione resta nella cronologia.

**Criteri di accettazione:**
- [ ] Dalla scheda richiesta: "Scrivi email" → scelta del modello → testo precompilato e modificabile → anteprima → invio
- [ ] Mittente `preventivi@<dominio>`, risposta alla casella aziendale, firma dell'operatore
- [ ] Messaggio salvato in `messages` e nella cronologia; il primo invio imposta `first_response_at`
- [ ] Con un modello di tipo `quote`, dopo l'invio la richiesta passa a `quote_sent` (se i campi obbligatori ci sono)
- [ ] Se l'invio fallisce il testo resta nell'editor e compare l'errore
- [ ] Typecheck e lint passano
- [ ] Test passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-068: WhatsApp e chiamate
**Descrizione:** Come operatore, voglio aprire WhatsApp con il messaggio già scritto, così rispondo dal telefono in pochi secondi.

**Criteri di accettazione:**
- [ ] "Apri WhatsApp" con un modello: apre `https://wa.me/<telefono>?text=<testo>` in una nuova scheda
- [ ] Al ritorno il pannello chiede "Messaggio inviato?"; con "Sì" registra l'attività (WhatsApp non conferma l'invio da solo) e, per i modelli `quote`, porta la richiesta a `quote_sent`
- [ ] Link `tel:` per chiamare, con registrazione dell'esito
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-069: Stato di consegna delle email
**Descrizione:** Come operatore, voglio sapere se un'email non è arrivata, così contatto il cliente in altro modo.

**Criteri di accettazione:**
- [ ] `/api/webhooks/resend` con verifica della firma
- [ ] Aggiorna `messages.status`: consegnata, rimbalzata, segnalata come spam
- [ ] Un'email rimbalzata crea il promemoria "Verifica l'indirizzo email" per l'assegnatario
- [ ] Typecheck e lint passano
- [ ] Test passano (firma valida e non valida)

### Epic J — Pagamenti

#### US-070: Modulo payments con Stripe Checkout
**Descrizione:** Come sviluppatore, voglio un modulo che crea link di pagamento sul conto Stripe dell'azienda, così nessun dato di carta passa dai nostri server.

**Criteri di accettazione:**
- [ ] `src/modules/payments` con l'interfaccia `createPaymentLink({ requestId, kind, amountCents, locale })` e `handleStripeEvent(event)`; adattatore Stripe e adattatore finto per i test
- [ ] Stripe Checkout Session in modalità `payment`, valuta EUR, `price_data` in linea (nessun prodotto creato nel catalogo Stripe), `expires_at` a 23 ore, email del cliente precompilata, `locale` it o en
- [ ] `metadata` con soli ID (`request_id`, `payment_id`); chiave di idempotenza `payment-<id>`
- [ ] Se `settings.terms_url` è impostato, Checkout chiede di accettare i termini (`consent_collection.terms_of_service`)
- [ ] Client Stripe compatibile con Workers (`Stripe.createFetchHttpClient()`); chiave limitata dell'azienda letta dai secret
- [ ] Riga in `payments` con stato `link_created`, URL e scadenza
- [ ] Typecheck e lint passano
- [ ] Test passano (adattatore finto e fixture Stripe)

#### US-071: Link acconto e saldo dal pannello
**Descrizione:** Come operatore, voglio creare il link dell'acconto in due clic, così il cliente paga mentre è ancora convinto (D42, D47).

**Criteri di accettazione:**
- [ ] Nella scheda richiesta, in fase `working` o `quote_sent` con totale impostato: "Crea link acconto" con importo al 20% (`settings.deposit_percent`), modificabile; "Crea link saldo" con il resto
- [ ] Dal pulsante al link copiato servono al massimo 2 clic; il link si può copiare, inserire nel modello "Preventivo" o aprire su WhatsApp
- [ ] Un nuovo link dello stesso tipo fa scadere subito su Stripe quello precedente non pagato
- [ ] Attività `payment_link_created` nella cronologia
- [ ] Typecheck e lint passano
- [ ] Test passano (20% con arrotondamento al centesimo)
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px (Stripe in modalità test)

#### US-072: Webhook Stripe
**Descrizione:** Come operatore, voglio che il pagamento risulti da solo nel CRM, così confermo il noleggio senza controllare Stripe.

**Criteri di accettazione:**
- [ ] `/api/webhooks/stripe`: corpo letto come testo; firma verificata con `constructEventAsync` e `Stripe.createSubtleCryptoProvider()`; firma non valida → 400
- [ ] Evento già registrato in `stripe_events` → 200 senza rielaborarlo
- [ ] `checkout.session.completed` con `payment_status = paid`: pagamento `paid`, attività `payment_received`; per l'acconto, fase `confirmed`, email di conferma al cliente e notifica al team
- [ ] Gestiti anche `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` e `checkout.session.expired`
- [ ] Pagamento su una richiesta `lost` o `canceled`: nessun cambio di fase, allerta al titolare
- [ ] Typecheck e lint passano
- [ ] Test passano (fixture firmate con un segreto di test, evento duplicato, firma errata)

#### US-073: Pagine di ritorno dal pagamento
**Descrizione:** Come cliente, voglio sapere cosa succede dopo il pagamento, così non resto nel dubbio.

**Criteri di accettazione:**
- [ ] `/pagamento-ricevuto` e `/pagamento-annullato` (+ EN), `noindex`, senza dati personali nell'URL
- [ ] "Ricevuto": la conferma arriva per email; contatti in evidenza. Non dà il pagamento per certo prima del webhook
- [ ] "Annullato": invita a riprovare dal link ricevuto o a scrivere su WhatsApp
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-074: Promemoria per acconti non pagati
**Descrizione:** Come operatore, voglio sapere quando un cliente non ha pagato, così lo ricontatto prima che cambi idea.

**Criteri di accettazione:**
- [ ] Link non pagato dopo 12 ore → promemoria "Ricorda l'acconto" all'assegnatario, con il modello `deposit_reminder` pronto
- [ ] Link scaduto → promemoria "Rigenera il link" e attività nella cronologia
- [ ] Nessun messaggio parte da solo verso il cliente: decide l'operatore
- [ ] Typecheck e lint passano
- [ ] Test passano (orologio fisso)

#### US-075: Pagamento registrato a mano
**Descrizione:** Come titolare, voglio registrare bonifici e pagamenti al ritiro, così il CRM sa sempre quanto è stato incassato.

**Criteri di accettazione:**
- [ ] Solo titolare: "Registra pagamento" con tipo (acconto, saldo), metodo (bonifico, contanti, POS al ritiro), importo, data, nota
- [ ] Un acconto registrato a mano porta la richiesta a `confirmed`
- [ ] Azione in `audit_logs`
- [ ] Typecheck e lint passano
- [ ] Test passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-076: Riepilogo pagamenti
**Descrizione:** Come operatore, voglio vedere acconto e saldo di una richiesta, così so cosa chiedere al ritiro.

**Criteri di accettazione:**
- [ ] Nella scheda richiesta: totale, acconto, saldo, stato, metodo e data di ogni pagamento
- [ ] Link al pagamento nella dashboard Stripe dell'azienda (rimborsi e contestazioni si gestiscono lì)
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

### Epic K — Calendario

#### US-077: Calendario della flotta
**Descrizione:** Come operatore, voglio vedere quando ogni auto è impegnata, così propongo date realistiche.

**Criteri di accettazione:**
- [ ] `/admin/calendario`: una riga per auto e una colonna per giorno; vista settimana e mese; blocchi colorati per motivo con legenda (colore più etichetta testuale)
- [ ] Su mobile, elenco per auto con i prossimi blocchi
- [ ] Un clic su un blocco di noleggio apre la richiesta collegata
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-078: Blocchi manuali
**Descrizione:** Come operatore, voglio segnare manutenzioni, lavaggi e trasferimenti, così nessuno conferma un'auto ferma (D23).

**Criteri di accettazione:**
- [ ] Crea, modifica ed elimina blocchi: manutenzione, lavaggio, trasferimento, altro noleggio, documenti, altro
- [ ] Due noleggi sovrapposti → messaggio chiaro con la richiesta in conflitto (errore del vincolo di esclusione tradotto)
- [ ] Typecheck e lint passano
- [ ] Test passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-079: Blocco automatico e avvisi
**Descrizione:** Come operatore, voglio che l'auto si blocchi quando il cliente paga, così il calendario è sempre aggiornato.

**Criteri di accettazione:**
- [ ] Passaggio a `confirmed` → blocco `rental` con le date della richiesta più il margine; se il vincolo fallisce, la conferma resta valida e parte un'allerta al titolare
- [ ] Passaggio a `canceled` o `lost` → il blocco collegato si cancella
- [ ] Avviso "Auto già impegnata in queste date" nella scheda richiesta e nell'inbox quando le date si sovrappongono a un blocco
- [ ] Typecheck e lint passano
- [ ] Test passano

### Epic L — Dopo la conferma

#### US-080: Consegna e riconsegna
**Descrizione:** Come operatore, voglio segnare consegna e riconsegna e ricevere promemoria, così non dimentico un ritiro.

**Criteri di accettazione:**
- [ ] Pulsanti "Auto consegnata" (`confirmed` → `on_rent`) e "Auto riconsegnata" (`on_rent` → `completed`)
- [ ] 24 ore prima del ritiro → promemoria all'assegnatario con la bozza `pickup_reminder` pronta da inviare
- [ ] Il giorno della riconsegna → promemoria all'assegnatario
- [ ] Typecheck e lint passano
- [ ] Test passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-081: Richiesta di recensione
**Descrizione:** Come titolare, voglio chiedere una recensione dopo ogni noleggio, così costruiamo la fiducia che oggi manca (D37).

**Criteri di accettazione:**
- [ ] 24 ore dopo `completed` → promemoria all'assegnatario con il modello `review_request` e il link `settings.review_url`
- [ ] Invio con un clic; non si propone se il contatto ha `do_not_contact = true`
- [ ] Attività registrata
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

### Epic M — Contenuti e impostazioni

#### US-082: Gestione FAQ
**Descrizione:** Come operatore, voglio aggiornare le FAQ, così rispondo alle domande che arrivano più spesso.

**Criteri di accettazione:**
- [ ] `/admin/contenuti/faq`: crea, modifica, ordina, pubblica; IT obbligatorio, EN consigliato (avviso se manca)
- [ ] Le pagine pubbliche si aggiornano entro 1 minuto
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-083: Gestione pagine città
**Descrizione:** Come operatore, voglio compilare le pagine di Firenze e degli aeroporti, così sono utili e specifiche.

**Criteri di accettazione:**
- [ ] Editor con i campi strutturati di US-043, campi SEO IT/EN e slug IT/EN
- [ ] Pubblicazione bloccata finché i campi obbligatori sono vuoti
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-084: Gestione blog
**Descrizione:** Come operatore, voglio scrivere articoli dal pannello, così il blog cresce senza lo sviluppatore.

**Criteri di accettazione:**
- [ ] Editor Markdown con anteprima; copertina caricata su R2 come le foto delle auto; autore; date; SEO IT/EN; stato
- [ ] Campo "Aggiornato il" modificabile
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-085: Testi e recensioni
**Descrizione:** Come operatore, voglio modificare i testi principali e pubblicare recensioni vere, così il sito resta aggiornato e credibile.

**Criteri di accettazione:**
- [ ] Modifica dei testi di `page_texts` (home, chi siamo, servizi, legali) per lingua, con anteprima
- [ ] Recensioni: si pubblicano solo con fonte (Google, Trustpilot, email), data, nome come autorizzato dall'autore e conferma del consenso
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-086: Impostazioni
**Descrizione:** Come titolare, voglio cambiare numeri, orari e regole dal pannello, così non serve uno sviluppatore per ogni modifica.

**Criteri di accettazione:**
- [ ] `/admin/impostazioni` (solo titolare): tutti i campi di `settings` elencati in 9.9
- [ ] Controllo di ogni campo; modifiche in `audit_logs`
- [ ] Typecheck e lint passano
- [ ] Test passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

### Epic N — Consenso e tracciamento

Prerequisito per la produzione: GATE-4. In staging si sviluppa e si prova senza attendere.

#### US-087: Banner cookie
**Descrizione:** Come visitatore, voglio scegliere davvero quali cookie accettare, così la mia scelta viene rispettata.

**Criteri di accettazione:**
- [ ] Banner con libreria open source (es. CookieConsent) e tre categorie: necessari (sempre attivi), statistiche (tracciamento interno e GA4), marketing (Google Ads e Meta Pixel)
- [ ] "Rifiuta" ha lo stesso peso visivo di "Accetta"; la X equivale a rifiutare; lo scroll non vale come consenso (linee guida del Garante, 2021)
- [ ] Scelta salvata in un cookie di prima parte per 6 mesi, con la versione dell'informativa; se la versione cambia il banner ricompare
- [ ] Ogni scelta registrata in `consent_records` (ID anonimo, versione, categorie, data), senza IP
- [ ] Il link "Preferenze cookie" nel footer riapre il pannello
- [ ] Testi IT/EN
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-088: Endpoint /api/track
**Descrizione:** Come sviluppatore, voglio un endpoint che accetta solo eventi puliti, così nel database non entrano dati personali.

**Criteri di accettazione:**
- [ ] Payload validato con Zod: solo tipi di evento ammessi, massimo 50 eventi per invio, massimo 2 KB per evento
- [ ] Richieste senza cookie di consenso "statistiche" valido → rifiutate
- [ ] Salva gli eventi e aggiorna la visita (prima pagina, referrer, UTM, dispositivo, paese dall'header di Cloudflare); l'IP non viene salvato
- [ ] Limite di frequenza per visita
- [ ] Risponde 204 in meno di 100 ms; la scrittura avviene con `after()`
- [ ] Typecheck e lint passano
- [ ] Test passano

#### US-089: Script di tracciamento
**Descrizione:** Come titolare, voglio sapere cosa guardano i visitatori che hanno dato il consenso, così miglioriamo le pagine che perdono clienti.

**Criteri di accettazione:**
- [ ] Script di prima parte ≤ 3 KB compresso, caricato solo con il consenso "statistiche"
- [ ] ID di visita anonimo in un cookie di prima parte che scade dopo 30 minuti di inattività
- [ ] Eventi: pagina vista, auto vista, galleria aperta, filtro usato, clic su CTA, WhatsApp e telefono, modulo iniziato, passo raggiunto, ultimo campo toccato (solo il nome), invio, scroll al 25/50/75/100%, uscita
- [ ] Non legge mai i valori dei campi (test sul payload inviato)
- [ ] Invio a gruppi con `navigator.sendBeacon` verso `/api/track`; alla revoca del consenso si ferma subito e cancella il cookie
- [ ] Typecheck e lint passano
- [ ] Test passano

#### US-090: Fonte della richiesta
**Descrizione:** Come titolare, voglio sapere da quale campagna o canale arriva ogni richiesta, così investo dove rende.

**Criteri di accettazione:**
- [ ] Senza consenso: UTM e referrer della pagina d'arrivo restano solo in memoria durante la navigazione e partono con la richiesta; nulla viene salvato sul dispositivo
- [ ] Con consenso: prima e ultima fonte salvate nel cookie della visita
- [ ] `requests.source` contiene `utm_source`, `utm_medium`, `utm_campaign`, referrer e pagina d'arrivo; `requests.acquisition` vale `ads`, `organic`, `social`, `direct`, `referral` o `unknown`
- [ ] Typecheck e lint passano
- [ ] Test passano (classificazione della fonte)

#### US-091: Chiusura delle visite e cronologia (TDD)
**Descrizione:** Come sviluppatore, voglio trasformare ogni visita in una cronologia breve e anonima, così l'IA la può riassumere.

**Criteri di accettazione:**
- [ ] Ogni 10 minuti un job chiude le visite inattive da 30 minuti e le segna `significant` se hanno almeno 2 pagine o 30 secondi
- [ ] `buildTimeline(events)` produce una cronologia compatta, ad esempio: "Google Ads → home 12s → catalogo, filtro SUV → Urus 2m10s, 8 foto → modulo iniziato, fermo al campo telefono → uscita"
- [ ] La cronologia non contiene dati personali (test con eventi che includono campi vietati)
- [ ] Test scritti prima del codice
- [ ] Typecheck e lint passano
- [ ] Test passano

#### US-092: Riassunto IA
**Descrizione:** Come operatore, voglio due righe su cosa cercava un visitatore e perché è uscito, così capisco cosa migliorare.

**Criteri di accettazione:**
- [ ] Adattatore IA in `src/modules/tracking/ai` con implementazione Workers AI (binding `AI`, modello da `AI_SUMMARY_MODEL`) e implementazione finta
- [ ] Solo per visite `significant`; prompt di sezione 9.7; risposta di 2–3 frasi in italiano salvata in `visit_summaries`
- [ ] Quota esaurita o errore → stato `quota_exceeded` o `failed` e nuovo tentativo il giorno dopo; il sito non rallenta
- [ ] Typecheck e lint passano
- [ ] Test passano (adattatore finto, quota esaurita)

#### US-093: Sezione Visitatori
**Descrizione:** Come operatore, voglio vedere le visite e i loro riassunti, anche dentro la richiesta, così preparo una risposta su misura.

**Criteri di accettazione:**
- [ ] `/admin/visitatori`: elenco con data, fonte, pagine, durata e riassunto; filtri "ha iniziato il modulo e non l'ha inviato", "ha visto l'auto X", fonte, periodo
- [ ] Dettaglio con cronologia completa, riassunto e link alla richiesta collegata
- [ ] Nella scheda richiesta compare il riassunto della visita collegata
- [ ] Ogni riassunto porta l'etichetta "Ipotesi dell'IA"; in elenco una nota fissa: "Sono incluse solo le visite che hanno accettato i cookie statistici"
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-094: GA4, Google Ads e Meta Pixel
**Descrizione:** Come titolare, voglio misurare le campagne pubblicitarie, così confronto il costo per richiesta (D62, D66).

**Criteri di accettazione:**
- [ ] Script caricati solo dopo il consenso della categoria giusta (statistiche per GA4; marketing per Ads e Meta) e dopo l'idratazione; ID da variabili d'ambiente
- [ ] Google Consent Mode v2 in modalità base: nessun tag Google prima del consenso
- [ ] All'invio di una richiesta: `generate_lead` per GA4 e Ads, `Lead` per Meta, senza dati personali
- [ ] Alla revoca del consenso i tag si fermano e i loro cookie si cancellano dove possibile
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px (nessuna richiesta di rete verso Google o Meta prima del consenso)

### Epic O — Statistiche

#### US-095: Cruscotto
**Descrizione:** Come titolare, voglio aprire il pannello e capire in 10 secondi come stiamo andando, così decido le priorità della giornata.

**Criteri di accettazione:**
- [ ] `/admin`: richieste nuove con tempo d'attesa, promemoria di oggi, preventivi da sollecitare
- [ ] KPI della settimana e del mese: richieste ricevute; **conversione visite → richieste** in evidenza (D83); conversione richiesta → confermata; tempo mediano di prima risposta; valore confermato
- [ ] Conversione visite → richieste calcolata sul solo campione con consenso (richieste collegate a una visita ÷ visite con consenso), con la formula spiegata sotto il numero
- [ ] Auto più richieste e più viste
- [ ] Typecheck e lint passano
- [ ] Test passano (KPI sui dati di prova)
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-096: Statistiche
**Descrizione:** Come titolare, voglio sapere dove perdiamo richieste e quali canali rendono, così miglioriamo vendite e marketing.

**Criteri di accettazione:**
- [ ] `/admin/statistiche` con periodo selezionabile: richieste per auto, categoria, canale, fonte e città; percorso nuova → preventivo → confermata → conclusa; motivi di perdita; tempo medio in ogni fase
- [ ] Grafici accessibili: etichette testuali, tabella alternativa, colore mai come unico segnale
- [ ] Typecheck e lint passano
- [ ] Test passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-097: Report mensile
**Descrizione:** Come titolare, voglio un riepilogo del mese pronto da stampare, così lo condivido con i soci.

**Criteri di accettazione:**
- [ ] `/admin/statistiche/report?mese=AAAA-MM`: KPI del mese, confronto con il mese precedente, motivi di perdita
- [ ] Stampa in A4 senza elementi di navigazione
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

### Epic P — SEO e GEO

#### US-098: Metadata e Open Graph
**Descrizione:** Come titolare, voglio titoli e anteprime curati, così il sito si presenta bene su Google, WhatsApp e social.

**Criteri di accettazione:**
- [ ] `generateMetadata` su ogni pagina pubblica: title unico, description, canonical assoluto, Open Graph e Twitter card nella lingua della pagina
- [ ] Schede auto: title "Noleggio <marca modello> a Firenze | VELOCI PRIVATE" (sostituibile dai campi SEO); immagine OG = copertina
- [ ] Un test fallisce se due pagine pubbliche hanno lo stesso title
- [ ] Typecheck e lint passano
- [ ] Test passano

#### US-099: hreflang
**Descrizione:** Come visitatore straniero, voglio che Google mi mostri la versione inglese, così leggo nella mia lingua.

**Criteri di accettazione:**
- [ ] Ogni pagina pubblica dichiara `it`, `en` e `x-default` (verso l'italiano), compresa sé stessa; URL assoluti e reciproci
- [ ] Le pagine senza traduzione EN pubblicata non dichiarano l'alternativa EN
- [ ] Test sui tag di 5 pagine campione
- [ ] Typecheck e lint passano
- [ ] Test passano

#### US-100: Sitemap e robots
**Descrizione:** Come titolare, voglio che i motori di ricerca trovino ogni pagina utile e nessuna pagina privata, così il sito si indicizza bene.

**Criteri di accettazione:**
- [ ] `sitemap.xml` generata dal database: home, catalogo, schede auto, marche, città, servizi, FAQ, cauzione, blog e pagine legali pubblicate; `xhtml:link` per le lingue; `lastmod` reale
- [ ] Escluse le pagine `noindex`: conferme, pagamenti, filtri, pannello
- [ ] `robots.txt`: `Disallow: /admin/` e `Disallow: /api/`; un solo gruppo `User-agent: *` che consente i crawler di ricerca, compresi quelli delle IA; riga `Sitemap:`
- [ ] Typecheck e lint passano
- [ ] Test passano

#### US-101: Dati strutturati
**Descrizione:** Come titolare, voglio che Google e le IA capiscano chi siamo e cosa noleggiamo, così ci mostrano nei risultati giusti.

**Criteri di accettazione:**
- [ ] `AutoRental` per l'azienda con `areaServed` (Firenze, Toscana), telefono, orari e `sameAs` verso i profili; nessun indirizzo inventato (sezione 8.6)
- [ ] `Car` per ogni auto con `offers`: `price` uguale al prezzo "da", `priceCurrency` EUR, `priceSpecification` al giorno
- [ ] `BreadcrumbList` sulle pagine interne, `FAQPage` (US-038), `BlogPosting` sugli articoli
- [ ] Il JSON-LD corrisponde ai contenuti visibili (test)
- [ ] Typecheck e lint passano
- [ ] Test passano

#### US-102: Breadcrumb e link interni
**Descrizione:** Come visitatore, voglio capire dove sono e passare a pagine collegate, così esploro la flotta senza perdermi.

**Criteri di accettazione:**
- [ ] Breadcrumb visibili su catalogo, schede, marche, città e blog
- [ ] Footer con link a città, marche e categorie; schede auto collegate alla marca e alle città
- [ ] Ogni pagina della sitemap si raggiunge dalla home in al massimo 3 clic (test sul grafo dei link)
- [ ] Typecheck e lint passano
- [ ] Test passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-103: llms.txt e flotta in testo
**Descrizione:** Come titolare, voglio che le IA trovino dati corretti su flotta e prezzi, così ci citano senza errori (D14).

**Criteri di accettazione:**
- [ ] `/llms.txt`: chi è VELOCI PRIVATE, zona servita, come funziona la richiesta, link a catalogo, cauzione e FAQ
- [ ] `/flotta.md`: auto pubblicate con prezzo "da", km inclusi, costo dei km extra, cauzione indicativa e data di aggiornamento
- [ ] Entrambi generati dal database e aggiornati a ogni pubblicazione
- [ ] Typecheck e lint passano
- [ ] Test passano

#### US-104: IndexNow
**Descrizione:** Come titolare, voglio che Bing scopra subito le pagine nuove, così compaiono prima anche nelle IA che usano Bing.

**Criteri di accettazione:**
- [ ] Alla pubblicazione o modifica di auto, pagine città e articoli: notifica IndexNow, con la chiave servita in `/<chiave>.txt`
- [ ] Al massimo una notifica per URL ogni 10 minuti; gli errori non bloccano il salvataggio
- [ ] Typecheck e lint passano
- [ ] Test passano

### Epic Q — Qualità e operazioni

#### US-105: Header di sicurezza
**Descrizione:** Come titolare, voglio un sito protetto dagli attacchi più comuni, così i dati dei clienti sono al sicuro.

**Criteri di accettazione:**
- [ ] Su tutte le risposte: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restrittiva, `frame-ancestors 'none'`
- [ ] Content-Security-Policy con domini consentiti: il sito, il dominio immagini, Turnstile, Sentry e i domini Google e Meta (usati solo con consenso). Niente `unsafe-eval`. `unsafe-inline` per gli script resta solo finché Next.js lo richiede sulle pagine statiche: i nonce renderebbero dinamiche tutte le pagine (decisione da registrare in un ADR)
- [ ] Test sugli header di `/`, di una scheda auto e di `/admin/login`
- [ ] Typecheck e lint passano
- [ ] Test passano

#### US-106: Registro attività
**Descrizione:** Come titolare, voglio sapere chi ha fatto cosa nel pannello, così ricostruisco ogni modifica importante.

**Criteri di accettazione:**
- [ ] `/admin/registro` (solo titolare): elenco filtrabile di `audit_logs` con chi, cosa, quando e su quale elemento
- [ ] Sola lettura
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

#### US-107: Conservazione e cancellazione dei dati
**Descrizione:** Come titolare, voglio che i dati vecchi si cancellino da soli e poter cancellare quelli di chi lo chiede, così rispettiamo il GDPR.

**Criteri di accettazione:**
- [ ] Job giornaliero: `purge_old_visits(settings.visit_retention_days)` (90)
- [ ] Job giornaliero: le richieste `lost` o `canceled` e i contatti senza richieste confermate più vecchi di `settings.lead_retention_months` (24, da confermare con il consulente) vengono anonimizzati
- [ ] "Cancella i dati del contatto (GDPR)" (solo titolare): anonimizza nome, email, telefono e note; tiene importi e date per le statistiche; azione in `audit_logs`
- [ ] Typecheck e lint passano
- [ ] Test passano

#### US-108: Backup e keep-alive
**Descrizione:** Come titolare, voglio una copia giornaliera del database, così un errore non cancella il lavoro.

**Criteri di accettazione:**
- [ ] GitHub Actions ogni giorno: `pg_dump` del database di produzione tramite il pooler di Supabase in modalità session (IPv4; la connessione diretta è solo IPv6), file compresso caricato su R2, conservazione 30 giorni
- [ ] Job giornaliero con una query leggera su ogni progetto Supabase, così il piano Free non si sospende
- [ ] `docs/ripristino.md` con la procedura di ripristino, provata una volta su un progetto di prova (esito annotato)
- [ ] Typecheck e lint passano

#### US-109: Budget di prestazioni
**Descrizione:** Come titolare, voglio che il sito resti veloce dopo ogni modifica, così non perdiamo visitatori da mobile.

**Criteri di accettazione:**
- [ ] Lighthouse CI (`@lhci/cli`) su home, catalogo, una scheda auto e una pagina città, emulazione mobile, mediana di 3 esecuzioni
- [ ] Soglie: Performance ≥ 90, Accessibilità ≥ 95, Best practice ≥ 95, SEO ≥ 95; LCP ≤ 2,5 s; CLS ≤ 0,1; TBT ≤ 200 ms
- [ ] JS iniziale ≤ 200 KB compresso sulle pagine pubbliche (controllo in CI)
- [ ] `PERF.md` registra ogni tentativo di ottimizzazione, compresi quelli annullati, con i numeri prima e dopo
- [ ] Typecheck e lint passano
- [ ] Test passano

#### US-110: Test end-to-end del flusso
**Descrizione:** Come titolare, voglio un test automatico del percorso completo, così ogni rilascio è sicuro.

**Criteri di accettazione:**
- [ ] Playwright in locale con Stripe in modalità test e adattatore email finto: richiesta dal sito su mobile → nel CRM → assegnata → preventivo con link acconto → evento firmato `checkout.session.completed` → fase `confirmed` → blocco nel calendario → consegna → riconsegna
- [ ] Secondo scenario: richiesta inserita a mano da WhatsApp → persa con motivo "Prezzo" → visibile nelle statistiche
- [ ] Gira in CI
- [ ] Typecheck e lint passano
- [ ] Test passano

#### US-111: Accessibilità automatica
**Descrizione:** Come visitatore che usa tastiera o lettore di schermo, voglio poter richiedere un'auto come tutti.

**Criteri di accettazione:**
- [ ] axe su home, catalogo, scheda auto, modulo (entrambi i passi), FAQ, login del pannello, inbox e scheda richiesta: zero violazioni "serious" e "critical"
- [ ] Test che completa il modulo di richiesta usando solo la tastiera
- [ ] Typecheck e lint passano
- [ ] Test passano

#### US-112: Manuale operatore e stati vuoti
**Descrizione:** Come operatore nuovo, voglio istruzioni brevi e schermate che mi guidano, così lavoro dal primo giorno.

**Criteri di accettazione:**
- [ ] `docs/manuale-operatore.md`: rispondere a una richiesta, creare il link dell'acconto, registrare un contatto, usare il calendario, leggere le statistiche. Frasi brevi, senza gergo
- [ ] Stati vuoti con istruzione e pulsante d'azione in inbox, contatti, calendario, flotta, modelli e visitatori
- [ ] Typecheck e lint passano
- [ ] Verifica nel browser con webapp-testing a 375 e 1440 px

---

## 6. Requisiti funzionali

**Sito pubblico**
- FR-1: Il sito deve essere in italiano (alla radice) e in inglese (`/en`), con percorsi tradotti e selettore di lingua verso la pagina equivalente.
- FR-2: Il catalogo deve mostrare solo auto pubblicate, filtrabili per categoria, marca, fascia di prezzo, posti e cambio, con i filtri nell'URL.
- FR-3: Ogni scheda auto deve mostrare prezzo "a partire da" al giorno (IVA inclusa), km inclusi, costo dei km extra, cauzione indicativa, requisiti del conducente e specifiche tecniche.
- FR-4: Ogni scheda auto deve avere "Richiedi la prenotazione"; su mobile il pulsante resta fisso in basso insieme a WhatsApp.
- FR-5: Le pagine di Firenze, Aeroporto di Firenze e Aeroporto di Pisa si pubblicano solo con tutti i contenuti specifici compilati.
- FR-6: Il sito deve avere pagine per marca, servizi, chi siamo, contatti, FAQ, cauzione, auto esclusive, blog e pagine legali.
- FR-7: Telefono, WhatsApp e dati aziendali devono venire dalle impostazioni, mai dal codice.

**Richiesta di prenotazione**
- FR-8: Il modulo deve avere 2 passi (il noleggio; i contatti), un riepilogo, errori per campo e una bozza conservata durante la sessione.
- FR-9: Il server deve rifiutare le richieste che non superano Turnstile, il limite di 5 invii all'ora per IP o la validazione.
- FR-10: Una richiesta valida deve creare o riusare il contatto (stessa email o stesso telefono) e ricevere un codice `VP-AAAA-NNNN`.
- FR-11: Il cliente deve ricevere subito un'email di conferma nella sua lingua; il team una notifica con il link alla richiesta.

**CRM**
- FR-12: Tutte le richieste, dal sito o inserite a mano, devono stare in un'unica pipeline con le fasi della tabella 4.3.
- FR-13: Il sistema deve impedire i passaggi di fase non consentiti e chiedere i campi obbligatori di ogni fase.
- FR-14: Ogni richiesta deve avere un assegnatario (round robin di base, titolare come riserva).
- FR-15: La scheda richiesta deve mostrare cronologia completa, note, preventivo, pagamenti, avvisi di calendario e riassunto IA.
- FR-16: L'inbox deve evidenziare le richieste oltre lo SLA di prima risposta.
- FR-17: Gli operatori devono poter registrare chiamate e messaggi esterni e creare promemoria.
- FR-18: Il sistema deve creare i promemoria e gli avvisi della tabella 4.4.
- FR-19: Il titolare deve poter unire contatti duplicati ed esportare richieste e contatti in CSV.
- FR-20: La ricerca globale deve trovare richieste, contatti e auto per codice, nome, email o telefono.

**Messaggi**
- FR-21: I modelli email e WhatsApp devono supportare i segnaposto di US-065 e bloccare l'invio se un valore manca.
- FR-22: Le email del pannello devono partire dal dominio aziendale, con risposta alla casella dell'azienda, ed essere salvate nella cronologia.
- FR-23: WhatsApp funziona con link `wa.me` e testo precompilato; l'invio si registra dopo la conferma dell'operatore.

**Pagamenti**
- FR-24: L'operatore deve poter creare dal pannello, in al massimo 2 clic, un link Stripe per l'acconto (20% di base) o per il saldo.
- FR-25: I link devono scadere dopo 23 ore; un nuovo link dello stesso tipo annulla il precedente non pagato.
- FR-26: Il webhook Stripe deve verificare la firma, ignorare gli eventi già ricevuti e aggiornare pagamento e fase.
- FR-27: Il pagamento dell'acconto deve confermare la richiesta e bloccare l'auto nel calendario.
- FR-28: Nessun dato di carta passa dai nostri server. Rimborsi e contestazioni si gestiscono nella dashboard Stripe dell'azienda.
- FR-29: Il titolare deve poter registrare pagamenti manuali (bonifico, contanti, POS).

**Calendario**
- FR-30: Il calendario deve mostrare i blocchi di ogni auto per motivo e impedire due noleggi sovrapposti, con un margine di 24 ore.
- FR-31: Scheda richiesta e inbox devono avvisare quando le date richieste si sovrappongono a un blocco.

**Contenuti e impostazioni**
- FR-32: FAQ, pagine città, blog, testi e recensioni devono essere modificabili dal pannello, in IT ed EN.
- FR-33: Una recensione non si pubblica senza fonte, data e consenso dell'autore.
- FR-34: Il titolare deve gestire le impostazioni della sezione 9.9 senza toccare il codice.

**Consenso e tracciamento**
- FR-35: Nessuno script statistico o di marketing deve partire prima del consenso della sua categoria.
- FR-36: Il banner deve offrire Accetta, Rifiuta e Personalizza con lo stesso peso; la X equivale a rifiutare.
- FR-37: Il tracciamento interno non deve mai registrare valori dei campi, IP, nome, email o telefono.
- FR-38: Le visite significative devono ricevere un riassunto IA di 2–3 frasi, mostrato come ipotesi.
- FR-39: Le visite non collegate a richieste si cancellano dopo 90 giorni.
- FR-40: Le richieste dal sito devono registrare fonte e canale di acquisizione anche senza consenso, senza salvare nulla sul dispositivo.

**Statistiche**
- FR-41: Il cruscotto deve mettere in evidenza la conversione visite → richieste (sul campione con consenso), la conversione richiesta → confermata e il tempo mediano di prima risposta.
- FR-42: Le statistiche devono mostrare richieste per auto, categoria, canale, fonte e città, il percorso per fase e i motivi di perdita.

**SEO e GEO**
- FR-43: Ogni pagina pubblica deve avere title e description unici, canonical, Open Graph e hreflang reciproci con `x-default`.
- FR-44: Sitemap e robots devono essere generati in automatico e contenere solo URL indicizzabili.
- FR-45: Il sito deve pubblicare JSON-LD `AutoRental`, `Car` con `Offer`, `FAQPage`, `BreadcrumbList` e `BlogPosting`, coerenti con il contenuto visibile.
- FR-46: Il sito deve esporre `/llms.txt` e `/flotta.md` generati dal database.

**Sicurezza e privacy**
- FR-47: Il pannello deve richiedere password e secondo fattore a tutti gli utenti.
- FR-48: Ogni tabella deve avere RLS attiva; il ruolo `anon` legge solo i contenuti pubblicati.
- FR-49: Ogni server action e route del pannello deve verificare sessione e ruolo.
- FR-50: Le azioni sensibili (utenti, impostazioni, esportazioni, pagamenti manuali, unioni, cancellazioni) devono finire nel registro attività.
- FR-51: Il titolare deve poter anonimizzare i dati di un contatto su richiesta dell'interessato.
- FR-52: Il database deve avere un backup giornaliero su R2 conservato 30 giorni.

---

## 7. Fuori perimetro

Restano fuori da questo PRD. Le voci della Fase 2 hanno un prezzo nel preventivo.

| Escluso | Perché / dove va |
|---|---|
| Checkout automatico con calcolo del prezzo (stagione, durata, giorno, km, extra) e disponibilità in tempo reale | Fase 2 (4.500 €). Serve prima un processo stabile con i partner (D19, D21) |
| Firma elettronica del contratto prima del pagamento (D53) | Fase 2 (1.500 €). Serve un contratto validato (D52). Al lancio Checkout chiede solo di accettare i termini |
| Area cliente con login (D41, D44) | Fase 2 (1.500 €) |
| Sito in francese e arabo (D34) | Fase 2 (800 € e 1.400 €). Struttura i18n e CSS logico già pronti |
| Cauzione o preautorizzazione online (D28, D50) | Resta all'azienda, al ritiro. Sul sito solo l'importo indicativo |
| Rimborsi e contestazioni dal pannello | Si fanno nella dashboard Stripe dell'azienda |
| CaRGOS, verifica automatica dei documenti, contratti, fatturazione e contabilità (D54, D55) | Restano all'azienda |
| Invio automatico su WhatsApp (WhatsApp Business API) | Solo link `wa.me` con testo precompilato |
| Integrazione automatica con Instagram, marketplace o sistemi dei partner | Le richieste si inseriscono a mano; i partner non accedono al pannello |
| Accesso al pannello per i partner della flotta | Non richiesto al lancio |
| Logo e identità visiva (D40) | Preventivo a parte. Al lancio, logotipo solo testo |
| Gestione campagne, social, produzione di foto e video (D62–D64, D69–D74) | Servizio mensile separato, su richiesta |
| Testi legali (privacy, cookie, termini, contratto) | Li scrive il consulente dell'azienda; noi li pubblichiamo |
| Traduzioni professionali | Fornite dall'azienda o da un traduttore |
| Modelli 3D, configuratore 3D, home a storyscrolling | Esclusi dalla scelta "premium leggero" del 10/11/2026 |
| Notifiche push e app nativa | Il pannello è installabile come PWA; le notifiche arrivano via email |
| Punteggio dei contatti con modelli statistici | Bastano SLA, urgenza (data di ritiro) e valore stimato |
| Newsletter e invii massivi | Esportazione CSV verso uno strumento esterno, solo per chi ha dato il consenso |
| Codici sconto e promozioni | Non richiesti |

---

## 8. Indicazioni di design

### 8.1 Modalità per superficie

| Superficie | Modalità (impeccable) | Cosa conta |
|---|---|---|
| Home, scheda auto, pagine città, auto esclusive | Persuadere | Foto vere, prezzo e condizioni chiari, un'unica azione principale |
| Blog, FAQ, cauzione, legali | Leggere | Struttura chiara, risposte brevi in apertura, righe sotto gli 80 caratteri |
| Pannello | Operare | Densità, coerenza, velocità; il brand vive nei dettagli |

### 8.2 Due direzioni visive da proporre in F1

Sono ipotesi di partenza per il designer. L'azienda ne sceglie una al GATE-2; la scelta va salvata in `design-system/veloci-private/MASTER.md`.

**Direzione A — "Notturno".** Segue il capitolato: palette scura con un accento caldo. Tono sportivo e discreto.

| Nome | Esadecimale | Uso |
|---|---|---|
| Notte | `#141B24` | Sfondo |
| Grafite | `#222B36` | Superfici e card |
| Avorio | `#EEE8DD` | Testo principale |
| Pietra | `#9AA3AD` | Testo secondario |
| Cuoio | `#9A5333` | Pulsanti (con testo Avorio) e testo grande; mai testo piccolo su Notte |

Tipografia: una sola famiglia variabile con asse di larghezza (es. Archivo, licenza OFL). Larghezza espansa per titoli e numeri delle prestazioni, normale per il testo. Elemento memorabile: CV, 0–100 e velocità massima composti in grande, come la strumentazione di bordo, nella scheda auto. Tutto il resto resta sobrio.

**Direzione B — "Pietra serena".** Chiara e architettonica: richiama la pietra grigia delle chiese di Brunelleschi a Firenze.

| Nome | Esadecimale | Uso |
|---|---|---|
| Calce | `#EDEFEC` | Sfondo |
| Inchiostro | `#1C2228` | Testo principale |
| Pietra serena | `#5E6B67` | Linee, testo secondario |
| Arenaria | `#C9CDC6` | Bordi e superfici |
| Cuoio | `#8A4A2B` | Pulsanti (con testo Calce) e accenti |

Tipografia: un serif umanista per i titoli e un sans per il testo, scelti dal designer. Elemento memorabile: griglia e spaziature su proporzioni modulari, con linee sottili color pietra serena come cornici architettoniche delle foto.

**Vincoli comuni**
- Contrasto verificato da test (US-017): ≥ 4,5:1 per il testo normale, ≥ 3:1 per testo grande ed elementi grafici.
- Caratteri con latino esteso. Per la Fase 2 deve esistere un compagno arabo coerente (es. IBM Plex Sans Arabic o Noto Kufi Arabic).
- Un solo elemento memorabile per pagina; il resto resta quieto.

**Default da evitare**
- Nero e oro con Cormorant e Montserrat: è la prima risposta del database di ui-ux-pro-max per "luxury" ed è il cliché del settore.
- Effetto vetro ("Liquid Glass"), proposto dallo stesso database ma pensato per le interfacce Apple.
- Sfondo crema `#F4F1EA` con serif a forte contrasto e accento terracotta; nero quasi puro con un solo accento acido.
- Etichette in MAIUSCOLO sopra ogni titolo, freccia "→" in coda ai pulsanti, testi uniti da puntini mediani, una sola parola in corsivo o colorata nel titolo.
- Card tutte uguali con la stessa ombra grigia; numerazioni 01/02/03 su contenuti che non sono una sequenza ("Come funziona" lo è).

### 8.3 Immagini

- Solo foto e video reali della flotta (capitolato). Nessuna immagine di repertorio di auto che non sono in flotta.
- In staging i segnaposto portano una scritta visibile "Foto provvisoria".
- Inquadrature coerenti: stesso rapporto (4:3 nelle card, 16:9 nella galleria), stessa luce, sfondo pulito.
- Testo alternativo che descrive l'auto e l'angolazione, es. "Lamborghini Urus grigia, vista di tre quarti anteriore".

### 8.4 Movimento

Regole da design-motion-principles; i nomi degli effetti vengono da animation-vocabulary.

| Superficie | Prospettiva | Regole |
|---|---|---|
| Sito pubblico | Jakub (rifinitura discreta); Jhey solo nella vetrina delle auto esclusive | 200–400 ms; un solo momento orchestrato all'apertura della home; niente dissolvenze dal basso su ogni sezione |
| Pannello | Emil (sobrietà e velocità) | Al massimo 180 ms; nessuna animazione sulle azioni frequenti né su quelle da tastiera |

- Transizioni previste: *Shared element transition* della foto dalla card alla scheda; galleria con scorrimento direzionale (avanti da destra, indietro da sinistra); *Crossfade* alla comparsa dei contenuti caricati. Niente scorrimenti direzionali tra pagine dello stesso livello.
- Solo `transform` e `opacity`. Mai animare larghezza, altezza o posizione.
- `prefers-reduced-motion`: ogni animazione non essenziale si spegne, senza eccezioni.
- Prima della messa online: audit del movimento con design-motion-principles.

### 8.5 Testi

**Gerarchia del messaggio della home** (bozza da validare con l'azienda; landing-page-copywriter)
- Promessa: l'auto scelta, consegnata dove si trova il cliente a Firenze o in aeroporto.
- Meccanismo: prezzo, km inclusi e cauzione visibili prima di chiedere; conferma della disponibilità da parte di una persona; acconto online solo dopo la conferma.
- Prova: [NEED: prove reali]. L'azienda è nuova e non ha clienti (D37): niente recensioni, numeri o anni di esperienza inventati. Si usano fatti verificabili: prezzi pubblici, condizioni scritte, consegna su appuntamento.
- Azione: "Richiedi la prenotazione" → risposta entro il tempo promesso → acconto solo dopo la conferma.

**Titoli candidati per la home** (da provare in A/B dopo il lancio)
1. "Supercar e SUV di lusso a Firenze, consegnati in aeroporto o in hotel"
2. "Scegli l'auto. Verifichiamo la disponibilità e te la portiamo dove sei."
3. "Prezzo, km inclusi e cauzione di ogni auto, scritti prima che tu chieda"

**CTA**: "Richiedi la prenotazione" (principale, ovunque), "Scrivici su WhatsApp" (secondaria), "Vedi le auto".

**Regole** (copywriting, frontend-design)
- Nessuna prova inventata; i dati mancanti restano `[NEED: ...]` finché l'azienda non li fornisce.
- Nessun tic da IA: contrasti "non X, ma Y", elenchi di negazioni, domande che si rispondono da sole, trattini lunghi nei titoli, parole vuote come "esperienza unica" o "senza pensieri".
- Tono esclusivo, elegante, sportivo, discreto (D75). Del cliente come "tu" o "Lei" lo decide l'azienda (domanda aperta 4); le bozze usano "tu".
- Ogni pulsante dice cosa succede ("Invia la richiesta", non "Invia"). Un'azione mantiene lo stesso nome in tutto il percorso.
- Gli errori dicono cosa è successo e come rimediare, senza scuse generiche.

**Struttura dell'email "Preventivo"** (sales-enablement)
1. Auto e date confermate.
2. Totale IVA inclusa e cosa comprende: km, assicurazione di base, consegna.
3. Acconto del 20% con link e scadenza del link.
4. Saldo: come e quando si paga.
5. Cauzione: importo e modalità al ritiro.
6. Documenti da portare.
7. Prossimo passo e contatto diretto dell'operatore.

**Piano editoriale iniziale del blog** (ai-seo; contenuti forniti dall'azienda, ogni articolo con autore e data)
- Come funziona la cauzione per un'auto di lusso a noleggio
- Requisiti per noleggiare una supercar in Italia: età, patente, carta di credito
- ZTL di Firenze: cosa sapere se arrivi con un'auto a noleggio
- Consegna in aeroporto a Firenze o a Pisa: come funziona

Ogni articolo apre con una risposta diretta di 40–60 parole e mostra "Aggiornato il".

### 8.6 SEO locale senza sede aperta al pubblico

Indicazioni da seo-audit (pagine locali e dati strutturati) e ai-seo.
- VELOCI PRIVATE serve una zona, non riceve clienti in una sede (D6, D20). Il sito dichiara la zona servita e il servizio su appuntamento; non mostra indirizzi di ritiro inventati.
- Il footer mostra la sede legale perché è un obbligo di legge, ma non è un punto di ritiro.
- I risultati arricchiti `LocalBusiness` di Google richiedono un indirizzo: senza indirizzo pubblico non sono garantiti. Si usa `AutoRental` con `areaServed`.
- Google Business Profile come attività che serve una zona, con indirizzo nascosto (lo crea l'azienda).
- Pagine città e aeroporti solo con informazioni utili e diverse tra loro (luoghi, tempi, costi, esempi). Le pagine fotocopia violano le regole di Google sulle doorway page.
- Nome, telefono e zona identici su sito, Business Profile e social.

### 8.7 Pannello

- Densità alta, tabelle leggibili, azioni principali sempre visibili.
- Mobile: barra inferiore a 5 voci, aree di tocco ≥ 44 px, azioni rapide (chiama, WhatsApp, email) in cima alla scheda richiesta.
- Scorciatoie da tastiera su desktop: `/` per la ricerca.
- Ogni elenco ha stato di caricamento, stato vuoto con istruzione ed errore con rimedio.
- Date nel formato "gio 14 nov, 10:30"; importi nel formato "1.500 €"; fuso Europe/Rome.
- La fase di una richiesta si legge da colore più etichetta, mai dal solo colore.

### 8.8 Accessibilità (WCAG 2.2 AA)

- Contrasto come in 8.2; focus sempre visibile e mai coperto dalla barra fissa su mobile.
- Aree di tocco di almeno 24×24 px (minimo AA), 44×44 px per le azioni principali.
- Etichette visibili, errori collegati al campo, riepilogo degli errori quando il modulo è lungo.
- Tutto usabile da tastiera, compresi galleria, filtri, dialoghi e calendario.
- Attributo `lang` corretto su ogni pagina; testo alternativo su ogni immagine che porta informazione.

---

## 9. Indicazioni tecniche

### 9.1 Stack

| Livello | Scelta |
|---|---|
| Framework | Next.js (App Router), React 19, TypeScript `strict` |
| Stile | Tailwind CSS con variabili CSS dal design system; solo proprietà logiche |
| Lingue | next-intl (IT alla radice, EN sotto `/en`) |
| Database e login | Supabase: Postgres, Auth con secondo fattore TOTP, RLS |
| Hosting | Cloudflare Workers tramite OpenNext; piano B Vercel (ADR-0001) |
| File | Cloudflare R2: foto, cache di Next.js, backup |
| IA | Cloudflare Workers AI |
| Anti-spam | Cloudflare Turnstile e limite di frequenza |
| Job periodici | Cron Trigger di Cloudflare (alternativa: GitHub Actions) |
| Email | Resend |
| Pagamenti | Stripe Checkout Sessions sul conto dell'azienda |
| Errori | Sentry (piano gratuito) |
| Consenso | CookieConsent (open source) |
| Validazione | Zod, libphonenumber-js |
| Test | Vitest, pgTAP, Playwright, axe, Lighthouse CI |
| CI | GitHub Actions |

### 9.2 ADR da scrivere in F1

Solo decisioni difficili da cambiare, sorprendenti senza contesto e nate da un vero compromesso (domain-modeling).

| ADR | Decisione | Alternativa scartata |
|---|---|---|
| 0001-hosting | Cloudflare Workers con OpenNext: costi entro 300 €/anno, R2, Workers AI e Turnstile nello stesso account | Vercel: Hobby non ammette uso commerciale, Pro costa circa 20 $/mese |
| 0002-richiesta-unica | Una sola entità Richiesta per tutto il ciclo, da nuova a conclusa | Tabelle separate per lead, opportunità e prenotazione: troppo per 3–8 noleggi al mese (D12) |
| 0003-pagamenti | Stripe Checkout Session creata dal pannello sul conto dell'azienda; il webhook è la fonte di verità | Payment Link riusabili (pagamenti doppi) o checkout integrato nel sito (Fase 2) |
| 0004-tracciamento | Tracciamento di prima parte e riassunto con Workers AI, solo con consenso e senza dati personali | Microsoft Clarity: dati a terzi e nessun collegamento alle richieste |
| 0005-immagini | Foto convertite in WebP nel browser e servite da R2 | Servizi di trasformazione delle immagini a pagamento |

### 9.3 Architettura del codice

Principi di codebase-design: moduli profondi, cioè interfacce piccole con molta logica dietro. I servizi esterni stanno dietro adattatori, ognuno con una versione finta per i test.

```
src/
  app/
    [locale]/...                 pagine pubbliche (it predefinito, en)
    admin/...                    pannello (solo it)
    api/
      track/route.ts
      cron/[job]/route.ts
      webhooks/stripe/route.ts
      webhooks/resend/route.ts
  modules/
    auth/        requireStaff, requireOwner
    audit/       audit()
    catalog/     query pubbliche del catalogo
    requests/    schema, pipeline, creazione, assegnazione, automazioni
    messaging/   renderTemplate, sendEmail (Resend | finto), whatsappLink
    payments/    createPaymentLink, handleStripeEvent (Stripe | finto)
    calendar/    blocchi, sovrapposizioni
    tracking/    ingest, closeSessions, buildTimeline, summarize (Workers AI | finto)
    stats/       calcolo dei KPI
    jobs/        registro e dispatcher dei job periodici
  components/    interfaccia condivisa: varianti esplicite, niente prop booleane
  lib/           client Supabase, logger, formattazione di date e prezzi, env, image loader
supabase/        migrations/, tests/ (pgTAP), seed.sql
messages/        testi dell'interfaccia it.json, en.json
content/         testi approvati dall'azienda
```

Regole:
- Pagine e route non scrivono sul database: chiamano i moduli.
- Le operazioni su più tabelle stanno in funzioni Postgres (una transazione), chiamate via RPC dal server.
- I componenti ricevono solo i dati che mostrano.
- Ogni modulo si testa dalla sua interfaccia.

### 9.4 Modello dati (campi principali)

Convenzioni: chiavi `uuid`; orari `timestamptz` in UTC, mostrati in Europe/Rome; importi in centesimi `integer`; testi bilingui in `jsonb` del tipo `{ "it": "...", "en": "..." }`; `created_at` e `updated_at` dove servono.

| Tabella | Campi principali |
|---|---|
| `staff_profiles` | `id` (= `auth.users.id`), `full_name`, `role` (`owner`, `operator`), `is_active` |
| `settings` | una riga con i campi di 9.9 e i dati aziendali (`company_name`, `legal_address`, `vat_number`, `rea`, `phone_e164`, `whatsapp_e164`, `public_email`, `notification_emails`, `business_hours`, `review_url`, `terms_url`) |
| `brands` | `slug`, `name`, `intro` (jsonb), `sort` |
| `categories` | `slug`, `name` (jsonb), `sort` |
| `fleet_partners` | `name`, `contact_name`, `phone`, `email`, `notes` |
| `vehicles` | `slug`, `brand_id`, `model`, `category_id`, `partner_id`, `status`, `badges` (text[]), `price_from_cents`, `km_included_per_day`, `extra_km_cents`, `security_deposit_cents`, `min_driver_age`, `min_license_years`, `power_hp`, `zero_to_100_s`, `top_speed_kmh`, `engine`, `seats`, `transmission`, `fuel`, `description`, `seo_title`, `seo_description` (jsonb), `internal_notes`, `sort_order` |
| `vehicle_images` | `vehicle_id`, `base_key`, `widths` (int[]), `width`, `height`, `alt` (jsonb), `sort_order`, `is_cover` |
| `vehicle_blocks` | `vehicle_id`, `starts_at`, `ends_at`, `reason`, `request_id`, `note`, `blocked_range`, `created_by` |
| `contacts` | `full_name`, `email` (citext), `phone_e164`, `preferred_channel`, `language`, `country`, `privacy_accepted_at`, `marketing_consent`, `marketing_consent_at`, `do_not_contact`, `notes`, `anonymized_at` |
| `requests` | `code`, `contact_id`, `vehicle_id`, `stage`, `stage_changed_at`, `channel`, `channel_detail`, `source` (jsonb), `acquisition`, `pickup_at`, `return_at`, `pickup_location_type`, `pickup_address`, `return_location_type`, `return_address`, `expected_km`, `second_driver`, `extras` (text[]), `customer_notes`, `assigned_to`, `quote_total_cents`, `quote_details` (jsonb), `deposit_percent`, `first_response_at`, `lost_reason`, `lost_note`, `visit_session_id` |
| `request_activities` | `request_id`, `type`, `payload` (jsonb), `actor_id` (null = sistema) |
| `tasks` | `request_id`, `assignee_id`, `type`, `title`, `due_at`, `done_at`, `dedupe_key`, `created_by` |
| `message_templates` | `name`, `kind`, `channel`, `language`, `subject`, `body`, `is_active` |
| `messages` | `request_id`, `template_id`, `channel`, `to_address`, `subject`, `body_html`, `body_text`, `provider_id`, `status`, `sent_by`, `sent_at` |
| `payments` | `request_id`, `kind`, `method`, `amount_cents`, `currency`, `status`, `stripe_session_id`, `url`, `expires_at`, `paid_at`, `note`, `created_by` |
| `stripe_events` | `event_id` (chiave), `type`, `received_at`, `processed_at` |
| `faqs` | `category`, `question`, `answer` (jsonb), `sort`, `status` |
| `location_pages` | `slug` (jsonb), `title`, `intro`, `delivery_points`, `notice`, `delivery_fees`, `examples`, `local_faqs` (jsonb), `featured_vehicle_ids`, `seo_title`, `seo_description`, `status` |
| `blog_posts` | `slug` (jsonb), `title`, `body` (jsonb, Markdown), `cover_key`, `author`, `published_at`, `content_updated_at`, `seo_title`, `seo_description`, `status` |
| `testimonials` | `author_display_name`, `text` (jsonb), `source`, `review_date`, `consent_confirmed_at`, `status` |
| `page_texts` | `key`, `locale`, `value` |
| `visit_sessions` | `id` (anonimo), `started_at`, `last_seen_at`, `ended_at`, `landing_path`, `referrer_host`, `utm` (jsonb), `device`, `country`, `pages`, `duration_s`, `significant`, `request_id` |
| `visit_events` | `session_id`, `occurred_at`, `type`, `path`, `vehicle_id`, `data` (jsonb, senza dati personali) |
| `visit_summaries` | `session_id`, `timeline`, `summary`, `model`, `status`, `attempts` |
| `consent_records` | `anon_id`, `policy_version`, `categories` (jsonb) |
| `audit_logs` | `actor_id`, `action`, `entity`, `entity_id`, `diff` (jsonb) |
| `job_runs` | `job`, `started_at`, `finished_at`, `ok`, `error` |

### 9.5 Immagini

- Bucket R2 dedicato, servito da un sottodominio (es. `img.<dominio>`) con cache lunga.
- Ogni foto in 4 varianti WebP (640, 1024, 1600, 2400 px), generate nel browser al caricamento.
- `next/image` con loader personalizzato: restituisce la variante più vicina alla larghezza richiesta. Nessuna ottimizzazione a runtime.
- Immagine LCP con `fetchpriority="high"` e `sizes` corretti; le altre con `loading="lazy"` e `decoding="async"`; sempre `width` e `height`.

### 9.6 Budget di prestazioni

Da performance-optimization: si misura prima, si corregge un solo collo di bottiglia alla volta e si annulla ogni modifica che non migliora i numeri.

| Voce | Limite |
|---|---|
| JavaScript iniziale (pagine pubbliche) | ≤ 200 KB compresso |
| CSS | ≤ 50 KB compresso |
| Immagine sopra la piega | ≤ 200 KB |
| Font | ≤ 100 KB in totale |
| Script di tracciamento | ≤ 3 KB compresso |
| LCP / INP / CLS | ≤ 2,5 s / ≤ 200 ms / ≤ 0,1 |
| API del pannello | p95 ≤ 200 ms |
| Script di terze parti | solo dopo idratazione e consenso |

### 9.7 Prompt del riassunto IA (bozza)

```
Sei un analista di un noleggio di auto di lusso a Firenze.
Ricevi la cronologia anonima di una visita al sito.
Scrivi 2 o 3 frasi in italiano:
1. cosa cercava il visitatore;
2. quanto sembrava interessato (basso, medio, alto) e da cosa lo deduci;
3. un'ipotesi sul perché è uscito senza inviare la richiesta, oppure "Ha inviato la richiesta".
Usa solo i fatti della cronologia. Se non bastano, scrivi "Dati insufficienti".
Cronologia: {timeline}
```

Modello configurabile con `AI_SUMMARY_MODEL`: un modello instruct piccolo del catalogo Workers AI, scelto verificando qualità in italiano e consumo della quota gratuita giornaliera.

### 9.8 Variabili e segreti

| Nome | Dove | Note |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | pubblica | URL assoluto del sito |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | pubbliche | chiave pubblicabile, mai quella segreta |
| `SUPABASE_SECRET_KEY` | segreto | solo nei file `server-only` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | pubblica / segreto | |
| `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET` | segreti | |
| `STRIPE_SECRET_KEY` | segreto | chiave limitata del conto dell'azienda; in staging chiave di test |
| `STRIPE_WEBHOOK_SECRET` | segreto | |
| `CRON_SECRET` | segreto | |
| `AI_SUMMARY_MODEL` | variabile | |
| `SENTRY_DSN` | variabile | |
| `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_GADS_ID`, `NEXT_PUBLIC_META_PIXEL_ID` | pubbliche | usate solo con consenso |
| `INDEXNOW_KEY` | variabile | |
| `NEXT_PUBLIC_IMAGES_BASE_URL` | pubblica | dominio delle immagini su R2 |

Binding Cloudflare: `PHOTOS` (R2), `AI` (Workers AI), `RATE_LIMITER` (limite di frequenza).

### 9.9 Impostazioni predefinite

| Campo | Valore iniziale | Fonte |
|---|---|---|
| `deposit_percent` | 20 | D47 |
| `rental_buffer_hours` | 24 | D22 |
| `min_lead_hours` | 24 | da confermare |
| `max_rental_days` | 90 | D51 |
| `first_response_sla_minutes` | 30 | da confermare (D58, D59) |
| `promised_response` | "entro 2 ore negli orari di apertura" | PIANO-v3, da confermare |
| `business_hours` | 9:00–20:00 tutti i giorni | da confermare |
| `assignment_mode` | `round_robin` | revops |
| `stale_days` | 3 | revops |
| `visit_retention_days` | 90 | PIANO-v3, sezione 4.4 |
| `lead_retention_months` | 24 | da confermare con il consulente |
| `review_url`, `terms_url` | vuoti | dall'azienda |

### 9.10 Sicurezza

Dalla checklist della skill supabase e da nodejs-backend-patterns:
- RLS su ogni tabella dello schema `public`; policy diverse secondo il vero modello di accesso.
- Mai `user_metadata` nelle decisioni di autorizzazione; il ruolo sta in `staff_profiles`.
- Le policy di UPDATE hanno sia `USING` sia `WITH CHECK`; ogni UPDATE ha anche una policy di SELECT.
- Viste con `security_invoker = true`; funzioni `security definer` solo nello schema `private`, con `search_path` vuoto e controllo di `auth.uid()`.
- Chiave segreta di Supabase solo nei file `server-only`; nessun segreto in variabili `NEXT_PUBLIC_*`.
- Ogni server action verifica sessione e ruolo come una route API.
- Zod su ogni input; limiti di frequenza su modulo, `/api/track` e login.
- Valori escapati in email e modelli; Markdown sanitizzato; celle CSV neutralizzate.
- Firma verificata su ogni webhook (Stripe, Resend); confronto in tempo costante per `CRON_SECRET`.
- Versioni dei pacchetti fissate e lockfile committato; `supabase db advisors` prima di ogni migrazione.

### 9.11 Limiti delle piattaforme da verificare

Valori noti al 10/11/2026: vanno ricontrollati nella documentazione durante lo sviluppo.

| Servizio | Limite | Effetto sul progetto |
|---|---|---|
| Cloudflare Workers | Dimensione del Worker: circa 3 MB compressi sul piano Free, 10 MB sul Paid | Un sito Next.js di solito richiede Workers Paid (circa 5 $/mese) |
| Cloudflare Cron Trigger | Numero di trigger limitato sul piano Free | Un solo trigger ogni 10 minuti con dispatcher interno |
| Workers AI | Quota gratuita giornaliera (circa 10.000 neuroni) | Riassunti solo per le visite significative; rinvio al giorno dopo |
| Resend Free | Circa 3.000 email al mese e 100 al giorno | Sufficiente al lancio; monitorare |
| Supabase Free | Sospensione dopo 7 giorni senza attività, 500 MB, nessun backup | Keep-alive, pulizia dei dati, backup su R2 (US-107, US-108) |
| Supabase, connessione diretta | Solo IPv6 | Il backup da GitHub Actions usa il pooler in modalità session |
| Stripe Checkout Session | Scade al massimo 24 ore dopo la creazione | Link a 23 ore e pulsante "Rigenera" |

### 9.12 Test

- Unitari (Vitest) per i moduli di dominio; TDD per pipeline, segnaposto, cronologia delle visite, calcolo dell'acconto e KPI.
- Database (pgTAP) per RLS, vincoli e funzioni.
- End-to-end (Playwright) su mobile e desktop; axe per l'accessibilità; Lighthouse CI per le prestazioni.
- "Test passano" vuol dire tutta la suite: un test rosso, anche se non causato dalla storia, va segnalato.

### 9.13 Revisioni durante lo sviluppo

| Momento | Chi | Skill |
|---|---|---|
| Fine di ogni epic | revisore-codice | — |
| Fine epic F (sito) e H (CRM) | designer-ui | impeccable (`critique`, `audit`), web-design-guidelines, ui-taste |
| Fine epic N (tracciamento) | garante-privacy | — |
| Fine epic P (SEO) | esperto-seo | seo-audit, ai-seo |
| Prima della messa online | collaudatore-qa; tu | design-motion-principles (audit), `/improve-codebase-architecture`, impeccable (`polish`, `harden`) |

---

## 10. Metriche di successo

**Consegna**
- Le 112 storie hanno `passes: true`; test end-to-end e Lighthouse CI verdi.
- Sito e CRM online entro il 09/02/2027 (obiettivo interno 22/01/2027).
- Costi ricorrenti ≤ 300 €/anno, commissioni Stripe escluse.

**Dopo il lancio (a 90 e 180 giorni, D83)**

| Metrica | Obiettivo | Dove si legge |
|---|---|---|
| Conversione visite → richieste (campione con consenso) | ≥ 1% | Cruscotto |
| Tempo mediano di prima risposta, negli orari di lavoro | ≤ 2 ore; ≥ 90% entro lo SLA | Cruscotto |
| Richieste con canale o fonte compilati | ≥ 95% | Statistiche |
| Richieste perse con motivo | 100% | Statistiche |
| Tempo da "preventivo accettato" a link acconto inviato | mediana ≤ 5 minuti | Cronologia delle richieste |
| Core Web Vitals al 75° percentile | "Buoni" | Search Console, quando ci sono dati |
| URL della sitemap indicizzati | ≥ 90% entro 60 giorni | Search Console |
| Citazioni nelle IA (15 domande, 3–5 prove per motore ogni mese) | Valore di partenza al lancio, poi andamento | `docs/seo/prompt-ia.md` |
| Richieste perse per errori tecnici | 0 | Sentry |

Il fatturato (D13) e il costo di acquisizione (D66) dipendono soprattutto dal marketing. Il sito li rende misurabili ma non sono criteri di accettazione del software (PIANO-v3, rischio 11).

---

## 11. Domande aperte

Le prime sei servono prima di avviare Ralph; le altre entro la fine di F3.

| # | Domanda | Valore usato finché non c'è risposta |
|---|---|---|
| 1 | Il franchisor esiste? Ha vincoli su marchio, sito o contratti? (D7, D52, D80) | Nessun vincolo |
| 2 | Dominio `.it` e `.com` e indirizzo mittente delle email | `preventivi@<dominio>` |
| 3 | Va bene un logotipo solo testo per il lancio? (D40) | Sì |
| 4 | Sul sito si dà del "tu" o del "Lei"? | "tu" |
| 5 | Orari di lavoro e tempo di risposta da promettere (D58, D59) | 9:00–20:00; "entro 2 ore" |
| 6 | Chi apre il conto Stripe e completa la verifica? Serve in modalità test prima di US-070 | L'azienda; nel frattempo un conto di test |
| 7 | Quanti operatori e con quale assegnazione? | Round robin tra Nicolò e Domenico (D2) |
| 8 | Elenco degli extra e dei servizi con i prezzi (assicurazione aggiuntiva, autista, consegna) | Nel modulo solo le voci, senza prezzi |
| 9 | Nel modulo si mostra anche una stima del totale? | No: solo "da X €/giorno" |
| 10 | L'acconto è il 20% del totale IVA inclusa? È rimborsabile? Condizioni di cancellazione | 20% del totale IVA inclusa; condizioni nei termini legali |
| 11 | Il saldo si paga online prima del ritiro o al ritiro? (D46) | Entrambe le possibilità |
| 12 | Preavviso minimo e durata minima del noleggio | 24 ore; 1 giorno |
| 13 | Come comunicano i partner la disponibilità delle auto e chi aggiorna il calendario? (D19, D21) | Un operatore aggiorna i blocchi a mano |
| 14 | Recensioni su Google o su Trustpilot? | Google Business Profile |
| 15 | Crawler di addestramento delle IA (GPTBot, ClaudeBot, Google-Extended): consentiti o bloccati? | Consentiti i crawler di ricerca; addestramento da decidere con l'azienda |
| 16 | Nel JSON-LD si pubblica la sede legale come indirizzo? | No |
| 17 | Conservazione dei dati: 24 mesi per i contatti non clienti e 90 giorni per le visite vanno bene al consulente? | Sì, fino a sua risposta |
| 18 | Conversioni avanzate (dati cifrati inviati a Google e Meta) | Disattivate |
| 19 | Responsabile privacy e CaRGOS (D55) | Da nominare a cura dell'azienda |
| 20 | Gli 8.000 € del mese 6 (D13) sono fatturato o margine? | Non blocca lo sviluppo |

