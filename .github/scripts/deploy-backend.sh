#!/usr/bin/env bash
# Remote deploy script for the Laravel backend on Hostinger shared hosting.
#
# Runs ON THE SERVER over SSH. The GitHub Actions runner streams this file
# into `bash -s`, so the server never needs a copy of it — the version that
# runs is always the one from the commit being deployed.
#
# Required environment (passed by the workflow):
#   DEPLOY_PATH  absolute path to the backend/ directory on the server
# Optional environment:
#   PHP_BIN, COMPOSER_BIN, DEPLOY_USER, DB_BACKUP_DIR, SKIP_DB_BACKUP
#
# Design rules:
#   - Idempotent: safe to run repeatedly, converges to the deployed commit.
#   - Never destructive: no `git reset --hard`, no `migrate:fresh`, no
#     dropping tables. `git pull` is --ff-only so a diverged server fails
#     loudly instead of silently overwriting production code.
#   - Backs up the database before any migration that has work to do.

set -euo pipefail

APP_DIR="${DEPLOY_PATH:?DEPLOY_PATH is required}"
PHP_BIN="${PHP_BIN:-php}"
COMPOSER_BIN="${COMPOSER_BIN:-composer}"
DB_BACKUP_DIR="${DB_BACKUP_DIR:-$APP_DIR/../db-backups}"
SKIP_DB_BACKUP="${SKIP_DB_BACKUP:-0}"

log()  { printf '\033[1;34m[deploy]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[fail]\033[0m %s\n' "$*" >&2; exit 1; }

cd "$APP_DIR"

[ -f artisan ] || die "artisan not found in $APP_DIR — wrong DEPLOY_PATH?"
[ -f .env ]   || die ".env missing in $APP_DIR. It is gitignored by design and must exist on the server."

# This is a monorepo: the git root is the repository root, one level above
# backend/, so there is no .git directory inside APP_DIR. Check that we are
# inside a work tree instead of looking for a .git folder here.
git rev-parse --is-inside-work-tree >/dev/null 2>&1 \
  || die "$APP_DIR is not inside a git checkout — the server must clone the repo (see DEPLOYMENT.md)."
GIT_ROOT="$(git rev-parse --show-toplevel)"

# Shared hosting runs artisan/composer against the CLI user, and any chmod of
# storage/ flips files to +x. Left alone, that shows up as a permanently
# dirty working tree and can block future pulls. core.fileMode=false tells
# git to ignore permission bits, which are managed by the hosting panel
# anyway and are not something a deploy should be changing.
git config core.fileMode false

# .env is preserved across deploys (gitignored), but surface drift early —
# a wrong APP_ENV/APP_DEBUG here is a security issue, not just a config nit.
grep -qE '^APP_ENV=production' .env || warn "APP_ENV is not 'production' in .env"
grep -qE '^APP_DEBUG=false'    .env || warn "APP_DEBUG is not 'false' in .env — errors may leak to visitors"

log "starting in $APP_DIR (git root: $GIT_ROOT)"

TARGET_BRANCH="${GITHUB_REF_NAME:-main}"
OLD_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
log "current commit: $OLD_COMMIT on $(git rev-parse --abbrev-ref HEAD)"

# ---------------------------------------------------------------------------
# 1. Pull the code
# ---------------------------------------------------------------------------
git fetch --quiet origin

# Refuse to move the server off a branch that holds commits the target branch
# does not — those would be lost. This is what makes switching branches safe.
if git show-ref --verify --quiet "refs/remotes/origin/$TARGET_BRANCH"; then
  UNIQUE="$(git log --oneline "origin/$TARGET_BRANCH..HEAD" 2>/dev/null | head -5)"
  if [ -n "$UNIQUE" ]; then
    die "server HEAD has commits not in origin/$TARGET_BRANCH, refusing to switch:
$UNIQUE
Resolve this on the server before deploying."
  fi
fi

# DRY_RUN=1 reports the full plan and exits before changing anything on disk.
# Used for a first deploy against a live shop, and for auditing a deploy by
# hand: `DRY_RUN=1 ssh <host> 'bash -s' < .github/scripts/deploy-backend.sh`.
if [ "${DRY_RUN:-0}" = "1" ]; then
  CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  CURRENT_SHA="$(git rev-parse --short HEAD)"
  TARGET_SHA="$(git rev-parse --short "origin/$TARGET_BRANCH" 2>/dev/null || echo unknown)"

  {
    echo "DRY RUN — nothing was modified."
    echo
    echo "  directory : $APP_DIR"
    echo "  git root  : $GIT_ROOT"
    echo "  now       : $CURRENT_BRANCH @ $CURRENT_SHA"
    echo "  target    : $TARGET_BRANCH @ $TARGET_SHA"
    if [ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]; then
      echo "  branch    : WOULD SWITCH ($CURRENT_BRANCH -> $TARGET_BRANCH)"
    else
      echo "  branch    : already on target"
    fi
    if [ "$CURRENT_SHA" = "$TARGET_SHA" ]; then
      echo "  code      : no change"
    else
      echo "  code      : WOULD UPDATE $CURRENT_SHA -> $TARGET_SHA"
      echo "  changed   :"
      git diff --name-only "$CURRENT_SHA" "origin/$TARGET_BRANCH" 2>/dev/null | sed 's/^/              /'
    fi
    echo "  composer  : would be $([ "$(git diff --name-only "$CURRENT_SHA" "origin/$TARGET_BRANCH" -- backend/composer.json backend/composer.lock 2>/dev/null)" ] && echo RUN || echo SKIPPED)"
    # grep -c prints 0 and exits 1 when nothing matches; adding `|| echo '?'`
    # inside the substitution would append a second line. `|| true` absorbs
    # the exit status without emitting text.
    echo "  migrations: $(php artisan migrate:status 2>/dev/null | grep -c 'Pending' || true) pending"
    echo "  storage   : no storage:link (uploads use the local disk + API route)"
  }
  log "dry run complete — no changes made"
  exit 0
fi

if [ "$(git rev-parse --abbrev-ref HEAD)" != "$TARGET_BRANCH" ]; then
  # Uncommitted work would be silently dropped by a checkout. `git status
  # --porcelain` catches untracked files too, which plain `git diff` misses.
  DIRTY="$(git status --porcelain 2>/dev/null || true)"
  if [ -n "$DIRTY" ]; then
    die "uncommitted changes in the working tree; refusing to switch branch:
$DIRTY
Resolve this in $GIT_ROOT and redeploy."
  fi
  log "switching to $TARGET_BRANCH"
  git checkout --quiet -B "$TARGET_BRANCH" "origin/$TARGET_BRANCH"
fi

git pull --quiet --ff-only origin "$TARGET_BRANCH"


NEW_COMMIT="$(git rev-parse --short HEAD)"
log "now at commit: $NEW_COMMIT on $(git rev-parse --abbrev-ref HEAD)"

# Diff against the commit we came from. Using HEAD@{1} would be wrong here: a
# branch switch rewrites the reflog, so it can point at an unrelated commit
# and hide a composer change (or invent one).
CHANGED=''
if git cat-file -e "$OLD_COMMIT^{commit}" 2>/dev/null; then
  CHANGED="$(git diff --name-only "$OLD_COMMIT" HEAD 2>/dev/null || echo '')"
else
  CHANGED="$(git show --name-only --pretty=format: HEAD 2>/dev/null || echo '')"
fi

COMPOSER_CHANGED=0
if [ -n "$CHANGED" ]; then
  case "$CHANGED" in
    *composer.json|*composer.lock) COMPOSER_CHANGED=1 ;;
  esac
  log "changed files: $(printf '%s\n' "$CHANGED" | grep -c .)"
else
  log "no file changes in this deploy"
fi

# ---------------------------------------------------------------------------
# 2. Dependencies
# ---------------------------------------------------------------------------
# Skip the (slow) composer run when composer files are untouched, unless
# vendor/ is missing entirely — e.g. the very first deploy.
if [ "$COMPOSER_CHANGED" -eq 1 ] || [ ! -d vendor ]; then
  log "installing composer dependencies (--no-dev --optimize-autoloader)"
  $COMPOSER_BIN install --no-dev --optimize-autoloader --no-interaction --no-progress
else
  log "composer files unchanged, skipping install"
fi

# ---------------------------------------------------------------------------
# 3. Writable paths
# ---------------------------------------------------------------------------
# Shared hosting often runs the web server as a different user than SSH, so
# chown when possible and fall back to chmod otherwise.
if [ -n "${DEPLOY_USER:-}" ] && id -u "$DEPLOY_USER" >/dev/null 2>&1; then
  chown -R "$DEPLOY_USER":"$DEPLOY_USER" storage bootstrap/cache 2>/dev/null \
    || warn "chown failed; continuing with chmod"
fi
# Set permissions per file type rather than `chmod -R 755`. A blanket 755 puts
# the execute bit on regular files (including the tracked .gitignore files in
# storage/), which shows up as a dirty working tree and can block later pulls.
# Directories need +x to be traversable; files do not.
find storage bootstrap/cache -type d -exec chmod 755 {} + 2>/dev/null || true
find storage bootstrap/cache -type f -exec chmod 644 {} + 2>/dev/null || true

# ---------------------------------------------------------------------------
# 4. Database backup (before migrations)
# ---------------------------------------------------------------------------
read_env() {
  # Reads a single key from .env, tolerating quotes and surrounding spaces.
  # Values are only ever passed to mysqldump as arguments, never eval'd.
  local val
  val="$(grep -E "^${1}=" .env | head -n1 | cut -d= -f2- \
        | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')" || true
  val="${val%\"}"; val="${val#\"}"
  val="${val%\'}"; val="${val#\'}"
  printf '%s' "$val"
}

PENDING="$($PHP_BIN artisan migrate:status 2>/dev/null | grep -c 'Pending' || true)"

BACKUP_FILE=""
if [ "${SKIP_DB_BACKUP}" != "1" ] && [ "$PENDING" -gt 0 ] && [ -f .env ]; then
  DB_NAME="$(read_env DB_DATABASE)"
  DB_USER="$(read_env DB_USERNAME)"
  DB_PASS="$(read_env DB_PASSWORD)"
  DB_HOST="$(read_env DB_HOST)"

  if [ -n "$DB_NAME" ] && command -v mysqldump >/dev/null 2>&1; then
    mkdir -p "$DB_BACKUP_DIR"
    chmod 700 "$DB_BACKUP_DIR" 2>/dev/null || true
    BACKUP_FILE="$DB_BACKUP_DIR/${DB_NAME}-$(date +%Y%m%d-%H%M%S)-pre-deploy.sql"
    log "backing up database '$DB_NAME' before $PENDING pending migration(s)"
    if MYSQL_PWD="$DB_PASS" mysqldump --host="${DB_HOST:-127.0.0.1}" \
         --user="$DB_USER" --single-transaction --quick --no-tablespaces \
         "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null; then
      chmod 600 "$BACKUP_FILE" 2>/dev/null || true
      log "backup written: $BACKUP_FILE"
    else
      rm -f "$BACKUP_FILE"
      warn "mysqldump failed — continuing WITHOUT a backup"
    fi
  else
    warn "no mysqldump available, skipping DB backup"
  fi
fi

# ---------------------------------------------------------------------------
# 5. Migrations
# ---------------------------------------------------------------------------
if [ "$PENDING" -gt 0 ]; then
  log "running $PENDING pending migration(s)"
  $PHP_BIN artisan migrate --force --no-interaction
  log "migrations applied"
else
  log "no pending migrations"
fi

# ---------------------------------------------------------------------------
# 6. Storage
# ---------------------------------------------------------------------------
# Deliberately NO `artisan storage:link` here. This app does not serve
# uploads through /storage: UploadController::serve() reads them from
# Storage::disk('local') (storage/app) behind the API token, so the public
# disk symlink is never used. Creating it would point public/storage at an
# empty storage/app/public and imply a direct-public path that does not exist.
#
# The only thing that must be writable is storage/app itself, handled above.
if [ -L public/storage ]; then
  warn "public/storage symlink exists but uploads are served from the local disk — safe to remove"
fi

# ---------------------------------------------------------------------------
# 7. Caches
# ---------------------------------------------------------------------------
# Cleared first so a config change that a previous run cached can't survive.
# These bake .env values in, so .env must be final before this point — it is,
# because .env is gitignored and never touched by a deploy.
log "rebuilding caches"
$PHP_BIN artisan config:clear
$PHP_BIN artisan config:cache
$PHP_BIN artisan route:cache
# view:cache walks resources/views with Symfony's Finder, which throws
# "directory does not exist" when the path is absent. This app serves a JSON
# API with no Blade views, so there is nothing to compile — compile only when
# the directory is actually there.
if [ -d resources/views ]; then
  $PHP_BIN artisan view:cache
else
  log "no resources/views directory — skipping view:cache"
fi

# ---------------------------------------------------------------------------
# 8. Report
# ---------------------------------------------------------------------------
{
  echo "### Backend deploy"
  echo
  echo "| | |"
  echo "|---|---|"
  echo "| Commit | \`$NEW_COMMIT\` |"
  echo "| Branch | \`${GITHUB_REF_NAME:-main}\` |"
  echo "| Pending migrations before run | $PENDING |"
  echo "| DB backup | \`${BACKUP_FILE:-not needed}\` |"
  echo "| Finished | $(date -u '+%Y-%m-%d %H:%M:%S UTC') |"
} >> "${GITHUB_STEP_SUMMARY:-/dev/null}" 2>/dev/null || true

log "deploy finished at commit $NEW_COMMIT"
