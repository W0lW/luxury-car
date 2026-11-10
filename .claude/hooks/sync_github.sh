#!/usr/bin/env bash
# Sincronizza il progetto con GitHub (origin/main) alla fine di ogni risposta di Claude.
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0
export GIT_TERMINAL_PROMPT=0

git add -A
if ! git diff --cached --quiet; then
  git commit -q -m "Sync automatico $(date '+%Y-%m-%d %H:%M')"
fi

# Integra eventuali modifiche dei collaboratori, poi carica
if ! git pull -q --no-rebase --no-edit origin main; then
  git merge --abort 2>/dev/null
  echo '{"systemMessage": "Sync GitHub: conflitto con modifiche remote, push non eseguito."}'
  exit 0
fi
if ! git push -q origin main 2>/dev/null; then
  echo '{"systemMessage": "Sync GitHub: push non riuscito."}'
fi
exit 0
