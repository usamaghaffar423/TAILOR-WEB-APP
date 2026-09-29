#!/usr/bin/env bash
# Dry-run the deploy script's git logic against a throwaway clone, so the real
# server is never the place a logic bug is discovered.
set -uo pipefail

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# A tiny repo that mimics the server: backend/ subdir inside a git root,
# a .env, and artisan — with no .git inside backend/ itself.
cd "$TMP"
git init -q --initial-branch=main .
git config user.email t@t.t; git config user.name t
mkdir -p backend storage/app bootstrap/cache
touch backend/artisan backend/composer.json backend/composer.lock
printf 'APP_ENV=production\nAPP_DEBUG=false\n' > backend/.env
echo one > backend/file.txt
git add -A; git commit -qm one
cd backend

# --- mirrors the script's git section ---
TARGET_BRANCH=main
OLD_COMMIT="$(git rev-parse --short HEAD)"

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "FAIL: not detected as work tree"; exit 1; }
GIT_ROOT="$(git rev-parse --show-toplevel)"
# git reports a Windows-style path here; compare the tail, not the raw string.
[ "$(basename "$GIT_ROOT")" = "$(basename "$TMP")" ] || { echo "FAIL: git root wrong: $GIT_ROOT"; exit 1; }
[ -d .git ] && { echo "NOTE: backend/.git exists (server differs from this fixture)"; }
echo "ok  work tree detected; git root = $(basename "$GIT_ROOT"); no .git inside backend"

# --- a new commit arrives on main, changing composer.json ---
cd "$TMP"; echo two > backend/file.txt; echo '{"x":1}' > backend/composer.json
git add -A; git commit -qm two
cd backend

UNIQUE="$(git log --oneline "origin/$TARGET_BRANCH..HEAD" 2>/dev/null | head -5 || true)"
# no origin here, so show-ref fails and the guard must be skipped, not abort
if git show-ref --verify --quiet "refs/remotes/origin/$TARGET_BRANCH"; then
  [ -z "$UNIQUE" ] || { echo "FAIL: would abort on unique commits"; exit 1; }
fi
echo "ok  guard skipped cleanly when origin/$TARGET_BRANCH is absent"

NEW_COMMIT="$(git rev-parse --short HEAD)"
CHANGED="$(git diff --name-only "$OLD_COMMIT" HEAD)"
echo "ok  diff $OLD_COMMIT..$NEW_COMMIT => $(printf '%s' "$CHANGED" | tr '\n' ' ')"

COMPOSER_CHANGED=0
case "$CHANGED" in *composer.json*|*composer.lock*) COMPOSER_CHANGED=1 ;; esac
[ "$COMPOSER_CHANGED" = 1 ] || { echo "FAIL: composer change not detected"; exit 1; }
echo "ok  composer.json change detected"

# --- the old HEAD@{1} approach, for contrast ---
git commit -q --allow-empty -m three
if git diff --name-only HEAD@{1} HEAD 2>/dev/null | grep -q composer.json; then
  echo "ok  HEAD@{1} happened to work here (no branch switch)"
else
  echo "note: HEAD@{1} misses composer.json after a reflog-moving commit"
fi

# --- branch switch guard: refuse to switch with uncommitted content ---
cd "$TMP"
git checkout -q -b feature/x
echo local-only > backend/only-local.txt
git add -A; git commit -qm "local commit on feature"
cd backend
UNIQUE="$(git log --oneline "main..HEAD" 2>/dev/null | head -5)"
if [ -n "$UNIQUE" ]; then
  echo "ok  unique-commit guard fires: would refuse to switch to main"
else
  echo "FAIL: unique-commit guard did not fire"
  exit 1
fi

# dirty working tree guard (we are inside backend/ here)
git reset -q --hard HEAD
# tracked modification
echo uncommitted >> file.txt
DIRTY="$(git status --porcelain)"
if [ -n "$DIRTY" ]; then
  echo "ok  uncommitted tracked change detected"
else
  echo "FAIL: dirty tracked tree not detected"; exit 1
fi
git reset -q --hard HEAD
# untracked file — plain `git diff` would MISS this
echo stray > stray.txt
DIRTY="$(git status --porcelain)"
if [ -n "$DIRTY" ]; then
  echo "ok  untracked file also detected (git diff would miss it)"
else
  echo "FAIL: untracked file not detected"; exit 1
fi
rm -f stray.txt

echo
echo "=== all deploy-script git logic checks passed ==="
