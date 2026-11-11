# Deploy su Cloudflare Workers

Il sito gira su Cloudflare Workers tramite OpenNext (`@opennextjs/cloudflare`, ADR-0001 in PRD 9.2). Configurazione: `wrangler.jsonc` e `open-next.config.ts`.

## Ambienti

| Ambiente | Worker | Supabase | Bucket R2 (foto / cache di Next.js) | Come si pubblica |
|---|---|---|---|---|
| Locale | `veloci-private-dev` (solo in locale) | locale (`supabase start`, serve Docker) | `veloci-private-photos-dev` / `veloci-private-opennext-cache-dev`, simulati da Wrangler in `.wrangler/` | non si pubblica |
| Staging | `veloci-private-staging` | progetto Supabase di staging | `veloci-private-photos-staging` / `veloci-private-opennext-cache-staging` | workflow "Deploy" con `staging` |
| Produzione | `veloci-private` | progetto Supabase di produzione | `veloci-private-photos` / `veloci-private-opennext-cache` | workflow "Deploy" con `production` |

Due Worker e due progetti Supabase separati: staging non tocca mai i dati di produzione. In staging Stripe usa la chiave di test.

## Binding

| Binding | Tipo | Uso |
|---|---|---|
| `PHOTOS` | R2 | foto delle auto in varianti WebP (PRD 9.5) |
| `AI` | Workers AI | riassunti delle visite. Solo in staging e produzione: Workers AI non ha un simulatore locale e Wrangler chiederebbe un account Cloudflare anche per `next build`. In locale il modulo usa l'adattatore finto |
| `NEXT_INC_CACHE_R2_BUCKET` | R2 | cache incrementale di Next.js (OpenNext) |
| `WORKER_SELF_REFERENCE` | servizio | richiesto dalla cache di OpenNext; ha il nome del Worker |
| `ASSETS` | risorse statiche | file di `.open-next/assets` |

`RATE_LIMITER` (PRD 9.8) arriva con la prima storia che limita la frequenza. I binding non si ereditano: ogni ambiente in `wrangler.jsonc` li ripete. Dopo ogni modifica di `wrangler.jsonc`, `npm run cf-typegen` rigenera i tipi (`cloudflare-env.d.ts`, non committato; lo rigenera anche `npm run typecheck`).

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run dev` | `next dev`; i binding locali (R2) sono disponibili tramite `initOpenNextCloudflareForDev` |
| `npm run preview` | build OpenNext e avvio nel runtime dei Workers (workerd) su http://localhost:8787; nessun account Cloudflare richiesto |
| `npm run check:worker-size` | dopo una build OpenNext: bundle con `wrangler deploy --dry-run`, stampa dimensione non compressa e compressa e la confronta con i limiti dei piani Free e Paid. Per un ambiente: `npm run check:worker-size -- --env=staging` |
| `npm run deploy:staging` / `npm run deploy:production` | build e deploy dal computer (serve `npx wrangler login`); di norma si usa il workflow |
| `npm run cf-typegen` | tipi di `env` (`CloudflareEnv`) per `getCloudflareContext()` |

In locale le variabili stanno in `.dev.vars` (per Wrangler, contiene `NEXTJS_ENV=development`) e `.env.local` (per `next dev`): mai committati. Elenco completo in `.env.example`.

## Workflow "Deploy" (GitHub Actions)

`.github/workflows/deploy.yml`, avvio manuale (Actions → Deploy → Run workflow → `staging` o `production`). Passi: `npm ci`, typecheck, lint e test, build OpenNext, controllo della dimensione, deploy.

Valori negli environment di GitHub `staging` e `production` (Settings → Environments). Per `production` conviene attivare i revisori obbligatori.

| Dove | Nomi |
|---|---|
| Secret | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `SUPABASE_SECRET_KEY`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET` |
| Variabili | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_IMAGES_BASE_URL`, `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_GADS_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `AI_SUMMARY_MODEL`, `SENTRY_DSN`, `INDEXNOW_KEY` |

- Le `NEXT_PUBLIC_*` entrano nel codice al momento della build: cambiarle richiede un nuovo deploy.
- I valori solo server vanno al Worker con `wrangler deploy --secrets-file` (file JSON temporaneo, cancellato a fine job). Un valore vuoto in GitHub non cancella quello già presente su Cloudflare; per toglierlo: `npx wrangler secret delete <NOME> --env <ambiente>`.
- Token `CLOUDFLARE_API_TOKEN`: modello "Edit Cloudflare Workers" più i permessi Workers R2 Storage (modifica) e Workers AI (lettura), limitato all'account dell'azienda.

## Prima pubblicazione (dopo GATE-1)

1. Account Cloudflare dell'azienda (probabile Workers Paid, vedi sotto) e `npx wrangler login`.
2. Bucket R2, una volta per ambiente:
   ```
   npx wrangler r2 bucket create veloci-private-photos-staging
   npx wrangler r2 bucket create veloci-private-opennext-cache-staging
   npx wrangler r2 bucket create veloci-private-photos
   npx wrangler r2 bucket create veloci-private-opennext-cache
   ```
3. Environment `staging` e `production` su GitHub con i valori della tabella.
4. Workflow "Deploy" su `staging`; poi dominio e sottodominio delle immagini (`img.<dominio>`, PRD 9.5) dalla dashboard di Cloudflare.
5. Rollback: `npx wrangler rollback --env production` (torna alla versione precedente del Worker).

## Immagini

`next/image` usa il loader `src/lib/image-loader.ts` (`images.loader: "custom"` in `next.config.ts`): nessuna ottimizzazione a runtime e nessun binding `IMAGES`. Come `src` si passa la chiave R2 senza larghezza ed estensione (`vehicles/<id>/<uuid>`); il loader restituisce `NEXT_PUBLIC_IMAGES_BASE_URL/vehicles/<id>/<uuid>-<larghezza>.webp` con la variante più piccola che copre la larghezza richiesta (640, 1024, 1600, 2400). `srcset` usa solo queste larghezze (`images.deviceSizes`). I file di `public/` (percorsi con `/` iniziale) restano invariati: per SVG e loghi usare `unoptimized`.

## Limiti della piattaforma

Verificati l'11/11/2026 su https://developers.cloudflare.com/workers/platform/limits/ (pagina aggiornata il 29/10/2026); i valori di PRD 9.11 sulla dimensione compressa (3 MB / 10 MB) non sono più validi.

| Limite | Free | Paid |
|---|---|---|
| Dimensione del Worker (non compressa) | 64 MiB | 64 MiB |
| Dimensione compressa | nessun limite | nessun limite |
| Tempo CPU per richiesta | 10 ms | 5 min |
| Richieste al giorno | 100.000 | senza limite |
| Sottorichieste per richiesta | 50 | 10.000 |
| Avvio del Worker | 1 s | 1 s |
| Cron Trigger per account | 5 | 250 |

Al primo controllo (11/11/2026, solo la home segnaposto) il Worker misurava 4,50 MiB non compresso e circa 0,95 MiB compresso. Con il rendering di Next.js i 10 ms di CPU del piano Free non bastano: resta consigliato Workers Paid.

## Windows

OpenNext avvisa che Windows non è pienamente supportato. Build e `npm run preview` funzionano su Windows 10 (verificato l'11/11/2026); se compaiono errori strani in locale, provare in WSL. La CI e il deploy girano su Linux.
