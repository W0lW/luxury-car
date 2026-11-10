# Ralph Agent Instructions

You are an autonomous coding agent working on a software project.

## Your Task

1. Read the PRD at `prd.json` (in the same directory as this file)
2. Read the progress log at `progress.txt` (check Codebase Patterns section first)
3. Check you're on the correct branch from PRD `branchName`. If not, check it out or create from main.
4. Pick the **highest priority** user story where `passes: false`
5. Implement that single user story
6. Run quality checks (e.g., typecheck, lint, test - use whatever your project requires)
7. Update CLAUDE.md files if you discover reusable patterns (see below)
8. If checks pass, commit ALL changes with message: `feat: [Story ID] - [Story Title]`
9. Update the PRD to set `passes: true` for the completed story
10. Append your progress to `progress.txt`

## Progress Report Format

APPEND to progress.txt (never replace, always append):
```
## [Date/Time] - [Story ID]
- What was implemented
- Files changed
- **Learnings for future iterations:**
  - Patterns discovered (e.g., "this codebase uses X for Y")
  - Gotchas encountered (e.g., "don't forget to update Z when changing W")
  - Useful context (e.g., "the evaluation panel is in component X")
---
```

The learnings section is critical - it helps future iterations avoid repeating mistakes and understand the codebase better.

## Consolidate Patterns

If you discover a **reusable pattern** that future iterations should know, add it to the `## Codebase Patterns` section at the TOP of progress.txt (create it if it doesn't exist). This section should consolidate the most important learnings:

```
## Codebase Patterns
- Example: Use `sql<number>` template for aggregations
- Example: Always use `IF NOT EXISTS` for migrations
- Example: Export types from actions.ts for UI components
```

Only add patterns that are **general and reusable**, not story-specific details.

## Update CLAUDE.md Files

Before committing, check if any edited files have learnings worth preserving in nearby CLAUDE.md files:

1. **Identify directories with edited files** - Look at which directories you modified
2. **Check for existing CLAUDE.md** - Look for CLAUDE.md in those directories or parent directories
3. **Add valuable learnings** - If you discovered something future developers/agents should know:
   - API patterns or conventions specific to that module
   - Gotchas or non-obvious requirements
   - Dependencies between files
   - Testing approaches for that area
   - Configuration or environment requirements

**Examples of good CLAUDE.md additions:**
- "When modifying X, also update Y to keep them in sync"
- "This module uses pattern Z for all API calls"
- "Tests require the dev server running on PORT 3000"
- "Field names must match the template exactly"

**Do NOT add:**
- Story-specific implementation details
- Temporary debugging notes
- Information already in progress.txt

Only update CLAUDE.md if you have **genuinely reusable knowledge** that would help future work in that directory.

## Quality Requirements

- ALL commits must pass your project's quality checks (typecheck, lint, test)
- Do NOT commit broken code
- Keep changes focused and minimal
- Follow existing code patterns

## Browser Testing (If Available)

For any story that changes UI, verify it works in the browser if you have browser testing tools configured (e.g., via MCP):

1. Navigate to the relevant page
2. Verify the UI changes work as expected
3. Take a screenshot if helpful for the progress log

If no browser tools are available, note in your progress report that manual browser verification is needed.

## Stop Condition

After completing a user story, check if ALL stories have `passes: true`.

If ALL stories are complete and passing, reply with:
<promise>COMPLETE</promise>

If there are still stories with `passes: false`, end your response normally (another iteration will pick up the next story).

## Important

- Work on ONE story per iteration
- Commit frequently
- Keep CI green
- Read the Codebase Patterns section in progress.txt before starting

---

## Regole di questo progetto (luxury-car)

Aggiunte al prompt originale di Ralph (snarktank/ralph, commit 6c53cb0). Se qualcosa sopra è in conflitto, valgono queste.

### Contesto
- PRD completo: `tasks/prd-veloci-private-sito-crm.md`. Ogni "sezione X" citata in una storia si legge lì. Alla prima storia leggi le sezioni 0.1, 0.2 e 9.
- Se esistono, leggi `docs/convenzioni.md`, `GLOSSARY.md`, `docs/adr/` e `design-system/veloci-private/MASTER.md`. Finché mancano valgono le sezioni 3 (glossario), 8 (design) e 9 (tecnica) del PRD.
- Le `notes` di ogni storia contengono regole dell'epic, cancelli e prerequisiti: leggile prima di iniziare.
- Ambiente: Windows 10 con Git Bash. Il percorso del progetto contiene uno spazio: metti sempre i percorsi tra virgolette.

### Quale storia fare
- Prendi la storia con `passes: false` e `priority` più bassa (numero più piccolo) che non è bloccata.
- Una storia è bloccata se:
  1. ha "Verifica nel browser" tra i criteri (o è US-017) e non esiste `design-system/veloci-private/MASTER.md` (GATE-2);
  2. per verificarne i criteri serve Supabase locale e `docker info` fallisce (prerequisito DOCKER);
  3. le `notes` indicano un prerequisito che manca;
  4. ha bisogno del lavoro di una storia precedente che non ha ancora `passes: true`.
- Lo stato di cancelli e prerequisiti è nei campi `cancelli` e `prerequisiti` di `prd.json`. Non modificarli.
- Una storia bloccata non si implementa nemmeno in parte. Se `progress.txt` non la segnala già, aggiungi una riga con storia e motivo; poi passa alla successiva.
- Se non resta nessuna storia sbloccata: scrivi in `progress.txt` cosa serve per ripartire e rispondi con <promise>BLOCKED</promise>. Lo script si ferma.

### Qualità
- Comandi: `npm run typecheck`, `npm run lint`, `npm test`; per il database anche `supabase test db`.
- Logica di dominio e storie TDD: prima il test, poi il codice (skill test-driven-development). Non modificare un test per farlo passare.
- Se un criterio fallisce: prima un comando che riproduce l'errore (skill diagnosing-bugs), poi la correzione.
- Verifica nel browser: skill webapp-testing a 375 e 1440 px, al posto di dev-browser.

### Cosa non fare
- Non cancellare né sovrascrivere i file già presenti nella radice: CLAUDE.md, README.md, chat.md, PIANO.md, PIANO-v3.md, skills-lock.json, il PDF del brief, il file `test`, `docs/`, `tasks/`, `.claude/`.
- Non modificare `chat.md` (lo aggiorna l'hook a fine risposta), `.claude/` e i file di Ralph (`scripts/ralph/CLAUDE.md`, `scripts/ralph/ralph.sh`). Le scoperte riusabili vanno nella sezione "Codebase Patterns" di `progress.txt`, in `docs/convenzioni.md` o nel CLAUDE.md della cartella del modulo.
- Git: lavora solo sul branch `ralph/veloci-sito-crm`. Niente merge o push su `main`, niente `--force`, niente riscrittura della storia.
- Non installare programmi di sistema (winget, choco, Docker, installer): se manca uno strumento, la storia è bloccata. Sono ammessi i pacchetti npm del progetto e Playwright per webapp-testing (`pip install playwright` e `python -m playwright install chromium`).
- Nessun segreto nel codice, nei log, nei commit o in `progress.txt`: in locale stanno in `.dev.vars`.
- Scrivi `progress.txt` in italiano.
