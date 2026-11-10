#!/usr/bin/env bash
# Sincronizza il progetto con GitHub (origin/main) alla fine di ogni risposta di Claude.
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0
export GIT_TERMINAL_PROMPT=0

git add -A
if ! git diff --cached --quiet; then
  git commit -q -m "Sync automatico $(date '+%Y-%m-%d %H:%M')"
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Integra eventuali modifiche dei collaboratori sullo stesso branch (se esiste su GitHub), poi carica
if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
  if ! git pull -q --no-rebase --no-edit origin "$BRANCH"; then
    git merge --abort 2>/dev/null
    echo "{\"systemMessage\": \"Sync GitHub: conflitto su $BRANCH, push non eseguito.\"}"
    exit 0
  fi
fi
if ! git push -q -u origin "$BRANCH" 2>/dev/null; then
  echo "{\"systemMessage\": \"Sync GitHub: push di $BRANCH non riuscito.\"}"
fi
exit 0
