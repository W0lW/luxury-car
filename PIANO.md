# Luxury Rent Car — Piano di lavoro (v2)

Fonte: `Luxury_Rent_Car_Specifiche_Progetto_Sviluppatori 1.pdf` (v1.0, 07/11/2026) + decisioni interne del 08/11/2026
Aggiornato: 08/11/2026 — nessun codice scritto finora.

Indice
0. Perimetro: cosa facciamo e cosa no
1. Flusso "Richiedi preventivo"
2. Pannello admin
3. Sito pubblico (frontend) — riferimento e direzione
4. Analisi della navigazione + riassunto con IA
5. SEO e indicizzazione
6. Piano di lavoro (F1 e F2 nel dettaglio, poi F3–F5)
7. Decisioni aperte da chiedere all'azienda
8. Account da creare, in ordine
9. Rischi e punti da mettere per iscritto
10. Costi annuali e manutenzione

---

## 0. Perimetro: cosa facciamo e cosa no

**Decisione presa con il collega (08/11/2026):** sviluppiamo **solo il sito e il pannello di gestione**. Pagamenti e parte amministrativa restano all'azienda.

| Incluso (lo facciamo noi) | Escluso (resta all'azienda) |
|---|---|
| Sito pubblico premium, mobile-first | Pagamenti online, Stripe, acconti, rimborsi |
| Catalogo flotta con schede auto | Cauzioni e preautorizzazioni |
| Modulo "Richiedi preventivo" | Contratti e firma elettronica |
| Pannello admin: richieste, risposte via email con modelli salvati, flotta, contenuti, statistiche | CaRGOS e adempimenti di legge |
| Analisi della navigazione con cookie + riassunto IA di ogni visita | Fatturazione e contabilità |
| SEO tecnica, indicizzazione, pagine per città/marca | Testi legali (privacy, condizioni): li scrive il loro consulente, noi li pubblichiamo |
| Cookie banner e consenso, collegati al tracciamento | Gestione campagne Ads (salvo accordo a parte) |

**Cambio rispetto al capitolato:** il capitolato prevede checkout, pagamenti, contratti e cauzioni (sezioni 04, 06 e 10). Con questa scelta, il flusso diventa **richiesta di preventivo → risposta dell'operatore**: il cliente non prenota e non paga sul sito.
→ Va **confermato per iscritto dall'azienda** (vedi sezione 9).

**Motivazione:** i siti di noleggio di lusso usano quasi tutti la richiesta di preventivo invece dell'acquisto immediato. Il ticket è alto, servono verifiche sul conducente e la trattativa è personale. Questo approccio elimina anche la parte più rischiosa del capitolato: cauzioni, doppie prenotazioni e pagamenti.

**Predisposizione per il futuro:** il modello dati resta compatibile con un'eventuale fase 2 con prenotazione e pagamento online. Non lo costruiamo ora, ma non lo rendiamo impossibile.

---

## 1. Flusso "Richiedi preventivo"

### Lato cliente

1. Il cliente vede l'auto con il prezzo "a partire da" (vedi decisioni) e clicca **"Richiedi preventivo"**. Sulla scheda auto il pulsante c'è sempre; su mobile resta fisso in basso, insieme a WhatsApp.
2. Compila un modulo breve, in **massimo 2 passaggi**:
   - **Passaggio 1 — il noleggio:** auto (già selezionata, oppure "consigliatemi voi"), data e ora di ritiro e riconsegna, luogo (sede / hotel / aeroporto / indirizzo), extra opzionali (es. autista, secondo conducente), note.
   - **Passaggio 2 — i contatti:** nome, email, telefono, canale preferito (email / telefono / WhatsApp), consenso privacy. Il consenso marketing è separato e facoltativo.
3. Vede una pagina di conferma con il riepilogo e i tempi di risposta (es. "entro 2 ore negli orari di apertura").
4. Riceve subito un'**email automatica di conferma** con il riepilogo.

**Requisiti UX:** il modulo funziona bene su mobile, salva quanto già scritto se il cliente torna indietro e mostra gli errori in modo chiaro, campo per campo.
**Anti-spam:** Cloudflare Turnstile (invisibile), campo nascosto anti-bot e limite di invii per IP.

### Lato azienda

- **Notifica immediata** per ogni nuova richiesta: email all'azienda e badge nel pannello. Opzionale: notifica push sul telefono (pannello installabile come app).
- La richiesta compare nella **homepage del pannello** (sezione 2).

---

## 2. Pannello admin

**Obiettivo:** l'operatore deve poter lavorare comodamente, anche dal telefono.

### 2.1 Homepage del pannello

- **Richieste nuove** in cima, con contatore e tempo trascorso dall'arrivo (es. "arrivata 25 min fa", in rosso oltre una soglia).
- Richieste da ricontattare oggi (follow-up programmati).
- Riepilogo rapido: richieste della settimana, tasso di conversione, tempo medio di prima risposta.
- Auto più richieste e più viste (dati dalla sezione 4).

### 2.2 Gestione richieste

**Stati di una richiesta:**
`nuova → in lavorazione → preventivo inviato → in attesa del cliente → confermata` oppure `persa` (con motivo: prezzo, date, nessuna risposta, altro) → `archiviata`.

**Scheda della richiesta:**
- Tutti i dati inviati dal cliente.
- L'auto richiesta, con avviso se in quelle date è già **segnata come impegnata** nel calendario interno.
- **Riassunto IA della navigazione** del cliente prima della richiesta, se ha dato il consenso. Esempio: "ha guardato Urus e Purosangue, ha confrontato i prezzi, è tornato due volte sulla scheda Urus".
- Storico di tutte le comunicazioni: email inviate dal pannello e contatti registrati a mano.
- Note interne e assegnazione a un operatore.

**Azioni rapide:**
- **Rispondi via email** dal pannello (vedi 2.3).
- **Chiama:** link `tel:` che funziona dal telefono.
- **WhatsApp:** apre una chat con un testo precompilato preso dai modelli salvati.
- **Registra contatto:** es. "chiamato, richiamare giovedì" → crea un promemoria.
- Cambia stato con un clic. Se la richiesta diventa "confermata", l'auto viene segnata come impegnata in quelle date.

### 2.3 Risposte salvate (modelli)

- Modelli creati e modificati dall'azienda, ad esempio: "Preventivo standard", "Auto non disponibile, alternativa", "Richiesta documenti", "Sollecito dopo 48h".
- **Segnaposto** compilati in automatico: `{{nome}}`, `{{auto}}`, `{{data_ritiro}}`, `{{data_riconsegna}}`, `{{luogo}}`, `{{prezzo}}`, `{{operatore}}`.
- Editor con anteprima prima dell'invio, testo modificabile caso per caso, firma aziendale.
- Invio dal dominio dell'azienda (es. `preventivi@dominio.it`). **Le risposte del cliente arrivano nella casella email normale dell'azienda** (reply-to).
- Modelli per WhatsApp con gli stessi segnaposto.

### 2.4 Altri moduli

| Modulo | Funzioni |
|---|---|
| **Flotta** | Aggiunta/modifica auto; foto trascinate con ridimensionamento e ottimizzazione automatici; ordine delle foto; specifiche (CV, 0-100, velocità massima, motore, posti, cambio); prezzo "a partire da" e costo per km extra; categoria; badge "In evidenza" / "In arrivo"; pubblicata / bozza |
| **Calendario interno** | Periodi in cui un'auto è impegnata (noleggi confermati, manutenzione). Solo per uso interno: serve agli avvisi nelle richieste. Mostrarlo al pubblico è una decisione da prendere |
| **Contenuti** | FAQ, pagine città, testi della home, recensioni in evidenza, eventuale blog/magazine |
| **Visitatori** | Elenco delle visite con riassunto IA, filtri (es. "ha iniziato il modulo ma non l'ha inviato", "ha visto l'auto X"), statistiche (sezione 4) |
| **Statistiche** | Richieste per auto, categoria, città, canale di provenienza e periodo; conversione richiesta → confermata; motivi di perdita |
| **Utenti** | Titolare e operatori con permessi diversi; accesso con autenticazione a due fattori; registro di chi ha fatto cosa |
| **Esportazione** | CSV delle richieste e dei contatti |

### 2.5 Comodità d'uso

- Pannello **responsive e installabile sul telefono** (PWA).
- Ricerca globale per nome, email, telefono o auto.
- Scorciatoie da tastiera su desktop.
- Interfaccia in italiano, senza gergo tecnico.
- Manuale breve per l'operatore, con video, consegnato insieme al sito.

---

## 3. Sito pubblico (frontend)

### 3.1 Sito di riferimento indicato

`https://mfitalyluxuryrent.com/flotta-supercar-auto-lusso` (visionato 08/11/2026)

**Cosa funziona e ne prendiamo lo schema (non testi, foto o marchio):**
- Catalogo con **filtri per categoria** (SUV, Prestige, Luxury, Cabrio) e sezioni per marca.
- Schede auto con **prezzo "a partire da" al giorno**, costo per km extra e **specifiche da appassionato**: CV, 0-100, velocità massima, motore.
- Badge sulle schede ("In arrivo", categoria).
- Auto "esclusiva" con accesso su richiesta: una vetrina speciale per il modello più prestigioso.
- Elementi di fiducia: anni di attività, recensioni Trustpilot, concierge 24/7, P.IVA visibile.
- WhatsApp e telefono sempre a portata di mano nell'header.
- Pagine per **città/destinazioni** e per **marca**, utili alla SEO. Nel footer ci sono molti link interni.
- Servizi aggiuntivi (autista, consegna in hotel/aeroporto/porto, matrimoni ed eventi).
- FAQ in fondo alla pagina.

**Dove possiamo fare meglio:**
- Nella pagina del riferimento **non c'è un modulo di preventivo visibile**: si passa da telefono, WhatsApp o pagina contatti. Da noi il modulo è **dentro la scheda auto**, con barra fissa su mobile ("Richiedi preventivo" + WhatsApp).
- Galleria foto a schermo intero, veloce, con lo swipe su mobile.
- Confronto tra 2–3 auto (opzionale).
- Prestazioni: immagini moderne (AVIF/WebP) e caricamento progressivo, con l'obiettivo di Core Web Vitals verdi su mobile.

### 3.2 Pagine

| Pagina | Contenuto |
|---|---|
| `/` | Hero con foto o video della flotta reale, ricerca rapida (date, città, categoria), auto in evidenza, servizi, recensioni verificabili, FAQ breve, CTA |
| `/auto` | Catalogo con filtri (categoria, marca, fascia di prezzo, posti, cambio) |
| `/auto/[marca-modello]` | Galleria, specifiche, prezzo "a partire da", condizioni principali (età, patente, cauzione indicativa), modulo preventivo, auto simili |
| `/marche/[marca]` | Pagina per marca (SEO) |
| `/noleggio-auto-lusso-[citta]` | Pagina per città, **solo per le città davvero servite** e con contenuto vero (vedi SEO) |
| `/servizi` | Consegna, autista, eventi, matrimoni (in base all'offerta dell'azienda) |
| `/preventivo` | Modulo generico ("consigliatemi un'auto") |
| `/chi-siamo`, `/contatti`, `/faq` | |
| `/privacy`, `/cookie`, `/termini` | Testi forniti dall'azienda |
| `/admin/*` | Pannello riservato |

### 3.3 Direzione visiva (dal capitolato)

Lusso automobilistico contemporaneo, palette scura con un accento caldo, foto della flotta reale, tipografia leggibile e microinterazioni leggere. Prezzi e condizioni sono **visibili**, non nascosti dietro una telefonata. Lingua: italiano, con la struttura già pronta per l'inglese, consigliato per la clientela internazionale.

---

## 4. Analisi della navigazione + riassunto con IA

### 4.1 Cosa chiede l'azienda

Un sistema (cookie compresi) che registra il percorso del cliente sul sito e, tramite un'IA gratuita, ne riassume **in breve cosa ha guardato e perché probabilmente se n'è andato**.

### 4.2 Come funziona (proposta)

1. **Consenso prima di tutto.** Il tracciamento parte solo se il visitatore accetta i cookie analitici nel banner. Senza consenso non si registra nulla.
2. **Raccolta (script nostro, leggero, primo livello).** Un ID anonimo di sessione registra questi eventi:
   - pagine viste e tempo su ciascuna, profondità di scroll;
   - auto viste, foto aperte, filtri usati;
   - clic sulle CTA, su WhatsApp e sul telefono;
   - modulo iniziato e fino a quale campo, **senza mai registrare cosa viene scritto**;
   - pagina di uscita, provenienza (Google, Ads, Instagram, link diretto, con parametri UTM) e dispositivo.

   Gli eventi vengono inviati a gruppi a `/api/track` e salvati in Supabase.
3. **Fine visita.** Dopo 30 minuti di inattività, un job automatico chiude la sessione e prepara una **cronologia compatta in testo**. Esempio: "Arriva da Google Ads → home 12s → catalogo, filtro SUV → Urus 2m10s, apre 8 foto → inizia il modulo, si ferma al campo telefono → esce".
4. **Riassunto IA.** La cronologia, **senza dati personali**, viene inviata al modello, che restituisce 2–3 frasi in italiano:
   - cosa cercava;
   - quanto era interessato;
   - **ipotesi** sul motivo dell'uscita (es. "si è fermato sul prezzo", "ha cercato una città non servita", "ha abbandonato il modulo al telefono").

   Nel pannello è sempre indicato come **ipotesi**, non come certezza.
5. **Collegamento alla richiesta.** Se nella stessa visita il cliente invia una richiesta di preventivo, il riassunto compare nella scheda della richiesta (sezione 2.2).
6. **Per risparmiare quota gratuita:** si riassumono solo le visite "significative" (es. almeno 2 pagine o 30 secondi). Le altre restano solo nelle statistiche.

### 4.3 Quale IA gratuita

| Opzione | Pro | Contro |
|---|---|---|
| **Cloudflare Workers AI** (consigliata) | Quota gratuita giornaliera, è già nel nostro stack (Cloudflare), modelli open (Llama, Mistral) e i dati non sono usati per addestrare i modelli | Modelli meno potenti dei più grandi, ma bastano per riassunti brevi |
| Google Gemini API (piano gratuito) | Modelli molto buoni | Sul piano gratuito i dati possono essere usati da Google. Per servizi rivolti a utenti UE i termini richiedono il piano a pagamento: **da verificare prima di usarlo** |
| Groq / OpenRouter (modelli gratuiti) | Veloci, gratuiti | Limiti variabili, server fuori UE, condizioni sui dati da controllare caso per caso |

**Scelta proposta:** Cloudflare Workers AI. Il codice resterà indipendente dal fornitore: cambiare modello sarà solo una modifica di configurazione.

### 4.4 Privacy (da far validare al loro consulente)

- Serve il **consenso esplicito** ai cookie analitici. Va descritto chiaramente nella cookie policy e nella privacy policy, che **devono citare l'analisi con IA**.
- Se il riassunto viene collegato a una persona che ha inviato una richiesta, diventa un dato riferito a quella persona: va indicato nell'informativa e valutato dal consulente, perché potrebbe essere considerato profilazione.
- All'IA non vengono **mai** inviati nome, email, telefono, contenuto dei campi o IP completo.
- Conservazione limitata: proposta di 90 giorni per le visite non collegate a richieste, poi cancellazione automatica.
- **Limite da spiegare all'azienda:** una parte dei visitatori rifiuterà i cookie e quelle visite non saranno analizzate. I dati saranno quindi un campione, non il totale.

### 4.5 Alternativa pronta (da citare all'azienda)

Microsoft Clarity è gratuito e offre registrazioni delle visite e riassunti IA già pronti. Contro: i dati vanno a Microsoft e non si integra nel pannello né con le richieste. Il sistema su misura è la scelta più coerente con la loro richiesta.

---

## 5. SEO e indicizzazione

### Tecnica (dentro il codice)

- Pagine generate lato server (Next.js), veloci e leggibili dai motori di ricerca.
- Per ogni pagina: `title`, meta description, canonical e Open Graph (anteprime su WhatsApp e social).
- URL leggibili: `/auto/lamborghini-urus`, `/noleggio-auto-lusso-milano`.
- `sitemap.xml` generata in automatico, compresa ogni auto e città aggiunta dal pannello, più `robots.txt`.
- **Dati strutturati schema.org:**
  - `AutoRental` / `LocalBusiness`: azienda, sedi, orari, contatti, recensioni;
  - `Car` / `Product` con `Offer` "a partire da" per ogni auto;
  - `FAQPage`;
  - `BreadcrumbList`.
- Immagini ottimizzate con testo alternativo descrittivo; Core Web Vitals verdi su mobile.
- `hreflang` predisposto per l'inglese.
- IndexNow (Bing) e invio della sitemap a Google Search Console.
- Campi SEO modificabili dal pannello per ogni auto e pagina.
- **Se l'azienda ha già un sito:** mappa dei redirect 301 dalle vecchie URL, per non perdere il posizionamento.

### Contenuti (con l'azienda)

- Pagine per **città realmente servite**, con contenuto unico: luoghi di consegna, aeroporti, esempi d'uso. Niente pagine copia-incolla con il solo nome della città cambiato, perché Google le penalizza.
- Pagine per marca e categoria.
- Ricerca parole chiave (es. "noleggio Lamborghini Milano", "noleggio auto di lusso [città]").
- Opzionale: blog/magazine per traffico informativo.

### Fuori dal sito (a carico dell'azienda, con il nostro supporto)

- Google Business Profile per ogni sede reale.
- Raccolta di recensioni (Google / Trustpilot).
- Bing Webmaster Tools.

---

## 6. Piano di lavoro

| Fase | Settimane* | Risultato |
|---|---|---|
| **F1 — Discovery + UX** | 1–2 | Requisiti confermati, design system, mockup di sito e pannello, modello dati |
| **F2 — Sito pubblico + preventivo** | 3–4 | Catalogo, schede auto, modulo preventivo funzionante con email e notifiche, flotta gestibile dal pannello |
| **F3 — Pannello richieste** | 5–6 | Homepage del pannello, gestione stati, modelli di risposta, invio email, WhatsApp, follow-up, calendario interno |
| **F4 — Tracciamento + IA** | 7–8 | Cookie banner con consenso, raccolta eventi, riassunti IA, sezione Visitatori, statistiche |
| **F5 — SEO, contenuti, QA, go-live** | 9–10 | Pagine città/marca, schema.org, sitemap, test, prestazioni, accessibilità, messa online, Search Console |

*Tempi indicativi, da ricalibrare insieme al collega.

### F1 — Discovery + UX (settimane 1–2)

**Settimana 1 — Requisiti e flussi**

| # | Attività | Output |
|---|---|---|
| 1.1 | Incontro con l'azienda: conferma del perimetro (sezione 0) e risposte alle decisioni della sezione 7 | Verbale + sezione 7 compilata |
| 1.2 | Raccolta contenuti: elenco auto, foto, prezzi "a partire da", città servite, servizi, recensioni, testi, logo | Cartella `contenuti/` |
| 1.3 | Mappa del sito (sezione 3.2) e mappa del pannello (sezione 2) | `docs/sitemap.md` |
| 1.4 | Flusso del preventivo e stati della richiesta, con chi fa cosa | `docs/flusso-preventivo.md` |
| 1.5 | Elenco degli eventi da tracciare e prompt per il riassunto IA, con 3–4 esempi di cronologia → riassunto atteso | `docs/tracciamento.md` |
| 1.6 | Spike tecnico (mezza giornata): Next.js su Cloudflare Workers (OpenNext) + Supabase + Workers AI. Verificare che tutto funzioni insieme | Nota "ok / non ok", con piano B (Vercel) |
| 1.7 | Analisi del sito attuale dell'azienda, se c'è: URL, posizionamento, cosa salvare | Lista dei redirect |

**Settimana 2 — Design e modello dati**

| # | Attività | Output |
|---|---|---|
| 2.1 | Direzione visiva: 2 proposte (palette, font, stile foto); ne sceglie una l'azienda | Moodboard |
| 2.2 | Design system: colori, testi, bottoni, card auto, form, badge, stati di errore; contrasto AA | Token Tailwind + `docs/design-system.md` |
| 2.3 | Mockup mobile-first: home, catalogo, scheda auto con modulo, conferma richiesta. Poi desktop | Mockup |
| 2.4 | Mockup del pannello: homepage, scheda richiesta con riassunto IA, editor dei modelli, flotta | Mockup |
| 2.5 | Modello dati: `vehicles`, `vehicle_images`, `categories`, `brands`, `locations`, `quote_requests`, `request_events`, `message_templates`, `messages`, `vehicle_bookings` (calendario interno), `visitor_sessions`, `visitor_events`, `session_summaries`, `pages_content`, `admin_users`, `audit_logs` | `docs/modello-dati.md` |
| 2.6 | Repository: Next.js (App Router) + TypeScript + Tailwind, linting, README, `.env.example` | Repo GitHub |
| 2.7 | Approvazione dei mockup da parte dell'azienda | **Gate F1 → F2** |

### F2 — Sito pubblico + preventivo (settimane 3–4)

**Settimana 3 — Dati e flotta**

| # | Attività | Dettaglio |
|---|---|---|
| 3.1 | Due progetti Supabase (staging + produzione), migration versionate | Nessuna modifica a mano in produzione |
| 3.2 | Tabelle della flotta e delle richieste (punto 2.5) | UUID, orari in UTC mostrati in fuso Europe/Rome, prezzi in centesimi |
| 3.3 | Row Level Security | Pubblico: sola lettura di auto/foto/pagine pubblicate. Richieste e visitatori: solo dal server e dal pannello |
| 3.4 | Login del pannello | Supabase Auth, autenticazione a due fattori, ruoli titolare/operatore |
| 3.5 | Pannello flotta | Aggiunta/modifica auto, upload foto con ottimizzazione, ordine, pubblicata/bozza, campi SEO |
| 3.6 | Dati di prova | 6–8 auto con foto provvisorie |

**Settimana 4 — Pagine pubbliche e modulo**

| # | Attività | Dettaglio |
|---|---|---|
| 4.1 | Layout, header (WhatsApp, telefono, CTA), footer | Dal design system |
| 4.2 | Home, catalogo con filtri, scheda auto con galleria | Dati reali da Supabase, immagini ottimizzate |
| 4.3 | Modulo preventivo in 2 passaggi | Validazione con Zod lato server, Turnstile, limite di invii, salvataggio della bozza nel browser |
| 4.4 | Email automatiche | Conferma al cliente + notifica all'azienda (Resend, dal loro dominio) |
| 4.5 | Elenco base delle richieste nel pannello | Il pannello completo arriva in F3 |
| 4.6 | SEO di base | Metadata, sitemap, robots (la SEO completa è in F5) |
| 4.7 | Test | Invio del modulo da mobile; spam bloccato; utente anonimo che non vede le richieste; email ricevute |
| 4.8 | Pubblicazione su staging per l'azienda | **Gate: demo all'azienda** |

---

## 7. Decisioni aperte da chiedere all'azienda

### Perimetro (prima di tutto)

- [ ] Confermano per iscritto: niente prenotazione e pagamento online, solo richiesta di preventivo?
- [ ] Hanno già un sito? Se sì, quale dominio e cosa va mantenuto?

### Flotta

- [ ] Quante auto al lancio, quali modelli, quali categorie?
- [ ] Foto professionali disponibili o da scattare? (il capitolato chiede foto **reali**)
- [ ] Specifiche da mostrare per ogni auto: CV, 0-100, velocità massima, motore, posti, cambio?
- [ ] Requisiti del conducente da mostrare (età minima, anni di patente, cauzione indicativa)?
- [ ] C'è un'auto "esclusiva" da mettere in vetrina?

### Prezzi sul sito

- [ ] Mostriamo il prezzo "a partire da" al giorno? (consigliato: lo chiede anche il capitolato)
- [ ] A quali condizioni vale quel prezzo (es. bassa stagione, minimo di giorni)?
- [ ] Costo per km extra visibile?
- [ ] Nel modulo mostriamo una **stima indicativa** del prezzo, oppure solo "riceverai un preventivo"?

### Territorio e servizi

- [ ] Città realmente servite (per le pagine SEO)?
- [ ] Sedi fisiche, orari, consegna a domicilio/hotel/aeroporto/porto?
- [ ] Servizi aggiuntivi: autista, matrimoni, eventi, altro?

### Richieste e risposte

- [ ] Chi risponde alle richieste? Quanti operatori?
- [ ] Indirizzo email da cui partono le risposte e casella in cui arrivano quelle dei clienti?
- [ ] Numero WhatsApp aziendale (WhatsApp Business)?
- [ ] Tempi di risposta promessi al cliente?
- [ ] Testi dei primi modelli di risposta (li prepariamo noi in bozza, li approvano loro)?
- [ ] Il calendario delle auto impegnate deve essere visibile al pubblico o solo interno?

### Tracciamento e IA

- [ ] Approvano il funzionamento della sezione 4 e i suoi limiti (solo chi accetta i cookie, motivi di uscita presentati come ipotesi)?
- [ ] Il loro consulente privacy aggiorna informativa e cookie policy?
- [ ] Usano Google Analytics / Google Ads / Meta Pixel? (se sì, vanno collegati allo stesso banner)

### Varie

- [ ] Lingue: solo italiano al lancio o subito anche inglese?
- [ ] Recensioni: Google, Trustpilot o altro? Link al profilo?
- [ ] Logo e brand esistenti o da creare?
- [ ] Chi gestisce hosting e account dopo la consegna, e chi ne è il proprietario? (vedi sezione 9)

---

## 8. Account da creare, in ordine

**Senza Stripe e senza firma elettronica** (fuori perimetro).
Consiglio: creare gli account **intestati all'azienda** o a un'email aziendale condivisa, con noi come collaboratori. Così alla consegna non c'è da trasferire nulla.

| # | Servizio | Quando | A cosa serve | Costo indicativo |
|---|---|---|---|---|
| 1 | **GitHub** | Subito | Codice sorgente (organizzazione condivisa tra noi due) | Gratis |
| 2 | **Cloudflare** | Subito | DNS, dominio, hosting (Workers), Turnstile anti-spam, **Workers AI** per i riassunti | Gratis per iniziare; Workers Paid ~5 $/mese probabile per un sito Next.js |
| 3 | **Dominio `.it` su register.it** (deciso 08/11) | Subito (o accesso a quello esistente) | Sito ed email. Nameserver puntati a Cloudflare (gratis): serve per collegare il dominio a Workers | ~15–30 €/anno (controllare il prezzo di **rinnovo**, non solo quello promozionale) |
| 4 | **Supabase — piano gratuito** (deciso 08/11) | Settimana 2–3 | Database, login del pannello. 2 progetti gratuiti: staging + produzione | Gratis. Limiti e contromisure nella sezione 10 |
| 5 | **Resend** | Settimana 4 | Email di conferma, notifiche e risposte dal pannello. Richiede record DNS | Gratis fino a ~3.000 email/mese |
| 6 | **Sentry** | Settimana 4 | Avvisi quando qualcosa si rompe | Gratis |
| 7 | **iubenda** (o Cookiebot) | F4 | Cookie banner con consenso, privacy e cookie policy | ~30–100 €/anno |
| 8 | **Google Search Console** + **Bing Webmaster** | Appena c'è il dominio | Indicizzazione, sitemap, monitoraggio SEO | Gratis |
| 9 | **Google Business Profile** | Prima del go-live (lo gestisce l'azienda) | SEO locale, recensioni | Gratis |
| 10 | GA4 / Tag Manager / Ads | Solo se l'azienda li usa | Misurazione delle campagne | Gratis (Ads a consumo) |

**Costo ricorrente:** vedi sezione 10 (con Supabase gratuito, ~75–180 €/anno).

---

## 9. Rischi e punti da mettere per iscritto

1. **Cambio di perimetro rispetto al capitolato.** Il PDF chiede pagamenti, contratti, cauzioni e checkout, e li usa come criteri di "progetto completato" (sezioni 10 e 13). Serve una **conferma scritta** dall'azienda che questi punti escono dal nostro incarico, altrimenti alla consegna possono contestarli.
2. **Riassunti IA = ipotesi.** L'IA non può sapere davvero perché un cliente esce: deduce dal comportamento. Va chiarito subito con l'azienda, per non creare aspettative sbagliate.
3. **Privacy del tracciamento.** È la parte più delicata del nostro perimetro. Serve il via libera del loro consulente su informativa, consenso e collegamento ai dati delle richieste, prima di andare online.
4. **IA gratuita = limiti di quota.** Se il traffico cresce, la quota gratuita può finire. Il sistema riassume solo le visite significative e, se la quota si esaurisce, rimanda i riassunti al giorno dopo, senza bloccare il sito.
5. **Contenuti reali.** Senza foto vere, prezzi e città servite non si va online, e la qualità percepita dipende soprattutto dalle foto.
6. **Proprietà e manutenzione.** Va deciso per iscritto chi possiede codice e account, chi paga i servizi ricorrenti e se è previsto un contratto di manutenzione.
7. **Il sito di riferimento** si usa solo come ispirazione per la struttura. Non si copiano testi, foto, layout identici o marchio.

---

## 10. Costi annuali e manutenzione (aggiornato 08/11/2026)

**Vincolo:** massimo 300 €/anno, anticipati da noi e rimborsati dall'azienda.

### 10.1 Costi annuali stimati

| Voce | Scelta | €/anno |
|---|---|---|
| Dominio `.it` | register.it | ~15–30 |
| DNS | Cloudflare (gratuito) | 0 |
| Hosting | Cloudflare Workers: **gratuito** se il sito rientra nel limite di dimensione del piano free (da verificare nello spike 1.6), altrimenti **Workers Paid 5 $/mese** | 0 oppure ~55–60 |
| Database + login | Supabase Free | 0 |
| Foto delle auto | Cloudflare R2 (10 GB gratuiti, nessun costo di traffico in uscita) | 0 |
| Riassunti IA | Cloudflare Workers AI (quota giornaliera gratuita) | 0 |
| Anti-spam | Cloudflare Turnstile | 0 |
| Email | Resend Free (~3.000/mese) | 0 |
| Errori | Sentry Free | 0 |
| Backup | GitHub Actions (gratuito) → copia giornaliera del database su R2 | 0 |
| Cookie banner + policy | **Opzione A:** banner open source (es. CookieConsent) + testi del loro consulente → 0 · **Opzione B:** iubenda | 0 oppure ~30–100 |
| **Totale** | | **minimo ~15–30 · realistico ~75–190** |

→ Restiamo sotto i 300 €. Il margine copre imprevisti (es. aumento di prezzo del rinnovo o superamento di una quota gratuita).

**Hosting alternativo (scartato):** Vercel Hobby è gratuito ma **non ammette uso commerciale**; il piano Pro costa ~20 $/mese (~220 €/anno) e consumerebbe quasi tutto il budget.

### 10.2 Limiti del piano gratuito di Supabase e contromisure

| Limite | Rischio | Contromisura |
|---|---|---|
| Il progetto **si sospende dopo 7 giorni senza attività** | Sito senza dati se nessuno lo visita per una settimana (probabile solo in staging o all'inizio) | Job giornaliero che interroga il database e lo tiene attivo |
| **Nessun backup automatico** sul piano Free | Perdita dei dati in caso di errore | Backup giornaliero automatico (`pg_dump`) su R2, conservato 30 giorni, con prova di ripristino prima del go-live |
| 500 MB di database | Gli eventi di tracciamento crescono nel tempo | Conservazione di 90 giorni + pulizia automatica |
| 1 GB di storage, 5 GB di traffico/mese | Le foto ad alta risoluzione lo esaurirebbero | Foto su **Cloudflare R2**, non su Supabase |

Se il sito cresce, il passaggio a Supabase Pro (~25 $/mese) richiede solo un cambio di piano, non di codice.

### 10.3 Pagamento dei servizi

Proposta: account intestati all'**azienda**, con la **loro carta**, e noi come collaboratori. Così non anticipiamo nulla, non c'è niente da rimborsare e il passaggio di proprietà è già risolto. Se invece anticipiamo noi, servono un accordo scritto sul rimborso e le ricevute.

### 10.4 Modelli di manutenzione da proporre

| | **Abbonamento annuale** | **A chiamata** |
|---|---|---|
| Prezzo | 2.000 €/anno (~167 €/mese) | 200 € a intervento |
| Cosa comprende | Gestione dei servizi e dei rinnovi, backup controllati, aggiornamenti di sicurezza, monitoraggio errori, piccole modifiche (es. fino a X ore al mese), tempo di risposta garantito (es. 24h lavorative) | Un intervento fino a N ore (es. 2–3 h), poi tariffa oraria |
| Non comprende | Nuove funzionalità (preventivo a parte) | Monitoraggio, aggiornamenti, backup controllati, tempi garantiti |

**Punti da decidere:**
- **Pareggio:** 2.000 € = 10 interventi. Se l'azienda prevede meno di 10 interventi l'anno, sceglierà la chiamata. L'abbonamento deve quindi offrire cose che la chiamata non dà: tranquillità, controllo continuo, priorità.
- **Una base minima serve in ogni caso:** senza aggiornamenti, backup controllati e qualcuno che segua i servizi gratuiti (sospensioni, quote, cambi di condizioni), il sito si degrada. Proposta: un **canone minimo** (es. 300–600 €/anno) anche per chi sceglie la chiamata, oppure una clausola scritta: "senza abbonamento, nessuna garanzia su disponibilità e sicurezza".
- **Definire per iscritto cos'è un'"uscita":** durata massima, cosa include, maggiorazione per urgenze o weekend.
- **Fatturazione:** verificare con un commercialista come fatturare (P.IVA, IVA inclusa o esclusa nei prezzi).

### 10.5 Proposta all'azienda: testo pronto (bozza, decisione del 08/11/2026: due opzioni)

> **Dopo la messa online: come seguiamo il vostro sito**
>
> **Per tutti, incluso nel progetto:** 60 giorni di garanzia dopo la messa online. Correggiamo gratis qualsiasi malfunzionamento del sito che abbiamo realizzato. Gli account dei servizi (dominio, hosting, database) sono intestati a voi: il sito resta sempre vostro.
>
> Dopo la garanzia potete scegliere tra due formule.
>
> **Opzione 1 — Assistenza Completa: 2.000 € + IVA all'anno**
> *Ci pensiamo noi, tutto l'anno.*
> - Costi dei servizi tecnici **inclusi** (hosting, database, rinnovo del dominio, cookie banner): nessuna bolletta a sorpresa
> - Controllo continuo: se il sito ha un problema ce ne accorgiamo noi, prima dei vostri clienti
> - Backup giornalieri, con verifica periodica che si possano davvero ripristinare
> - Aggiornamenti di sicurezza regolari
> - Fino a 2 ore al mese di modifiche incluse (testi, nuove pagine città, sistemazioni grafiche, nuovi modelli di risposta)
> - Risposta entro 24 ore lavorative; **sito non raggiungibile: intervento entro 4 ore, anche nel weekend**
> - Breve report mensile: visite, richieste di preventivo ricevute, andamento su Google
> - Sconto del 15% su nuove funzionalità
> - Pagamento annuale anticipato o in due rate semestrali; rinnovo automatico, disdetta con 30 giorni di preavviso
>
> **Opzione 2 — Su chiamata: 200 € + IVA a intervento**
> *Ci chiamate quando vi serve.*
> - Ogni intervento comprende fino a 2 ore di lavoro; oltre, 80 € + IVA l'ora
> - Presa in carico entro 3 giorni lavorativi
> - Urgenze, sere e weekend: +50%
> - I servizi tecnici (circa 75–190 € l'anno) li pagate direttamente voi
> - Nessun controllo, backup verificato o aggiornamento continuativo: interveniamo solo su vostra richiesta. Per questo, in questa formula, non possiamo garantire disponibilità e sicurezza del sito tra un intervento e l'altro. Consigliamo almeno 2 controlli di sicurezza l'anno.
> - Potete passare all'Assistenza Completa in qualsiasi momento.
>
> **In breve:** l'Assistenza Completa costa quanto 10 interventi, ma comprende anche i costi dei servizi, il controllo continuo e le urgenze in 4 ore.

**Da completare prima dell'invio:** verificare con il commercialista IVA e fatturazione, confermare tra di noi i tempi di risposta che riusciamo davvero a garantire (in particolare le 4 ore nel weekend), mettere tutto nel contratto.
