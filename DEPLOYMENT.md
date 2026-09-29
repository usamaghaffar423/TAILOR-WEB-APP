# Deployment

| Piece | Where | Trigger |
|---|---|---|
| `frontend/` | Vercel — `https://tailor-web-app-iota.vercel.app` | auto on push to `main` |
| `backend/` | Hostinger — `https://darkred-mosquito-143226.hostingersite.com` | `.github/workflows/deploy-backend.yml`, auto on push to `main` |

Both are live and healthy. The backend is a plain JSON API under `/api`; the
frontend is a static SPA with no server-side rendering.

---

## Backend: how the automated deploy works

`.github/workflows/deploy-backend.yml` runs on any push to `main` that touches
`backend/**` (frontend-only pushes deliberately skip it). It:

1. validates the repository variables are set,
2. writes the deploy key and pins the host key,
3. streams `.github/scripts/deploy-backend.sh` to the server over `bash -s`,
4. polls `/api/ping` and fails the run if the API does not report `ok`.

The script on the server pulls the commit, installs Composer dependencies,
**backs up the database if migrations are pending**, runs `migrate --force`,
repoints `storage`, and rebuilds config/route/view caches.

The script is piped in over stdin rather than living on the server, so the
version that runs is always the one from the commit being deployed — you can
never end up with a server running a stale deploy script.

### Safety properties

- `git pull --ff-only` — if the server has diverged, the deploy **fails** rather
  than silently discarding commits that exist only on the server.
- `migrate --force` only ever runs when `migrate:status` reports pending rows.
- No `migrate:fresh`, no `reset --hard`, no table drops anywhere.
- A `concurrency` group prevents two deploys racing over the same `vendor/`
  and migration table.
- `composer install` is skipped when `composer.json`/`composer.lock` are
  unchanged, unless `vendor/` is missing.

---

## One-time setup (required before the first automated deploy)

A dedicated ed25519 key pair has been generated on the developer machine for
this purpose:

| | |
|---|---|
| Private key | `~/.ssh/github_actions_tailor_app` → goes into the GitHub **secret** |
| Public key | `~/.ssh/github_actions_tailor_app.pub` → goes into hPanel |
| Fingerprint | `SHA256:0bdiQzE0q9y4IIc1ewziJFMPPjMEvbnuNh2Nj5HkxZU` |

A separate, older key (`SSH-KEY-TAILOR-APP`,
`SHA256:yHjfHDrEbKT93EP7xkjufirOOkvX4PCRlrufVSSC0g4`) is registered in hPanel
but **its private half is not held anywhere**, so it cannot be used to
authenticate. It can be deleted from hPanel.

### 1. Add the public key to Hostinger

hPanel → **Advanced → SSH Access** → **SSH Keys** → add:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIE9dIszZcDbIYIb0xi5nBFpRHzK0P9CUzpUiTM69W+g3 github-actions-tailor-app
```

Hostinger can take a minute to propagate a newly added key. If the first
connection is refused, wait a minute and retry.

Note: hPanel showed **SSH status: INACTIVE** at the time of writing, yet
`82.112.239.120:65002` accepted a TCP connection and completed an SSH
handshake, so the listener is up. If key auth keeps being refused after the
key is added, click **Enable** on that page and retry.

### 2. Repository variables

Repo → **Settings → Secrets and variables → Actions → Variables** tab:

| Variable | Value |
|---|---|
| `DEPLOY_HOST` | `82.112.239.120` |
| `DEPLOY_PORT` | `65002` |
| `DEPLOY_PATH` | absolute path to `backend/` on the server (see step 4) |
| `DEPLOY_USER` | `u463999436` |
| `HEALTHCHECK_URL` | `https://darkred-mosquito-143226.hostingersite.com/api/ping` |
| `KNOWN_HOSTS_FINGERPRINT` | the three fingerprints below, comma-separated |

The host offers three host keys. All three are pinned, so any additional or
substituted key aborts the deploy:

```
SHA256:BtUq1zV/nWtR7iWPQPiynbrxXTR0KKTsTxH8NXWC9+U,RSA
SHA256:ngpSY5Bnkgl/sbkDvxZIuj/nkgJ/Mp3DoLVfJgWkfSY,ECDSA
SHA256:EqtZh/QDWXdviacv0FtK/6JUWro0unRouktIUkXDmk0,ED25519
```

Paste only the `SHA256:...` parts, comma-separated, with no spaces:

```
SHA256:BtUq1zV/nWtR7iWPQPiynbrxXTR0KKTsTxH8NXWC9+U,SHA256:ngpSY5Bnkgl/sbkDvxZIuj/nkgJ/Mp3DoLVfJgWkfSY,SHA256:EqtZh/QDWXdviacv0FtK/6JUWro0unRouktIUkXDmk0
```

If Hostinger ever rotates its host keys the deploy will refuse to run. Verify
the new fingerprint from hPanel before updating this value — that refusal is
the check doing its job, not a malfunction.

### 3. Repository secret

**Secrets** tab → new secret named `DEPLOY_SSH_KEY`. Read the private key
locally and paste its **full contents** (all lines, from
`-----BEGIN OPENSSH PRIVATE KEY-----` to the matching `END` line):

```powershell
Get-Content $env:USERPROFILE\.ssh\github_actions_tailor_app -Raw
```

Never commit this file, and never paste it into a chat, issue, or PR.

Capture the host key fingerprint for `KNOWN_HOSTS_FINGERPRINT`:

```bash
ssh-keyscan -p 65002 <DEPLOY_HOST> 2>/dev/null | ssh-keygen -lf -
```

### 4. Confirm the server-side path and git remote

The server is already a git clone, but confirm it can actually fetch and that
`DEPLOY_PATH` is right — the path in the old `CACHE_CRON.md` is wrong. Over
SSH:

```bash
cd <candidate-path>
pwd
git remote -v
git fetch origin && git status -sb
ls artisan
```

`DEPLOY_PATH` is the directory that contains `artisan` **and** whose parent is
a git checkout of this repo.

### 5. First deploy

Run it manually once from the **Actions** tab → **Deploy Backend** →
*Run workflow* so you can watch the first run with the real server in view.

`.env` is gitignored, so a deploy never overwrites it. It must already exist on
the server, with `APP_ENV=production`, `APP_DEBUG=false`, and `FRONTEND_URL` set
to the exact deployed frontend origin — see below.

---

## Environment: the two values that silently break everything

| Where | Key | Must equal |
|---|---|---|
| Vercel | `VITE_API_URL` | `https://darkred-mosquito-143226.hostingersite.com` (no trailing slash) |
| Hostinger `.env` | `FRONTEND_URL` | `https://tailor-web-app-iota.vercel.app` (no trailing slash) |

Vite reads `VITE_*` **at build time**, so changing it requires a redeploy, not
a reload. CORS echoes `FRONTEND_URL` verbatim; a scheme, port, or trailing-slash
mismatch fails every request from the browser while `curl` still succeeds.

Verify the live pairing at any time:

```bash
curl -s https://darkred-mosquito-143226.hostingersite.com/api/ping
# {"status":"ok","db_status":"ok","php_version":"8.3.33",...}

curl -si https://darkred-mosquito-143226.hostingersite.com/api/dashboard \
  -H 'Origin: https://tailor-web-app-iota.vercel.app' | grep -i access-control-allow-origin
# Access-Control-Allow-Origin: https://tailor-web-app-iota.vercel.app
```

---

## Server facts (verified over SSH)

Checked against the live account on 2026-09-29. These are facts, not
assumptions — the earlier drafts of this file got several of them wrong.

| Item | Value |
|---|---|
| App directory (`DEPLOY_PATH`) | `/home/u463999436/domains/darkred-mosquito-143226.hostingersite.com/laravel/backend` |
| Git root | `.../laravel` — the **monorepo root**, one level above `backend/` |
| Public URL | `https://darkred-mosquito-143226.hostingersite.com` (document root is already `laravel/backend/public`) |
| CLI PHP | **8.2.33** |
| Web PHP | **8.3.33** |
| `composer.json` platform | pinned to `8.2.30`, so `composer install` on the CLI matches |
| `.env` | present, `APP_ENV=production`, `APP_DEBUG=false`, `FRONTEND_URL=https://tailor-web-app-iota.vercel.app` |
| Migrations | all 21 applied |
| `public/storage` | **does not exist, and must not** |

Two consequences worth understanding:

- **The CLI and web PHP versions differ.** `artisan migrate` and
  `config:cache` run under 8.2 while requests are served under 8.3. Fine for
  this app, but it means a cached config is generated by a different PHP than
  the one serving it. Don't be surprised by the version mismatch in logs.
- **No `storage:link`.** Uploads are written to `Storage::disk('local')`
  (`storage/app`) and read back through `GET /api/uploads?path=...`, which is
  behind the API token. The public symlink is not just unnecessary, it would
  be misleading — and pointing `public/` at private uploads would weaken the
  auth boundary. The deploy script deliberately does not create it. (Note
  `SKILL-backend.md` still says uploads live in `storage/app/public`, which is
  out of date.)

The server was also found checked out on `feature/unified-sales` rather than
`main`. That branch is fully merged into `main`, so nothing was lost, but it
meant `main` was several commits ahead of what production was running. The
deploy script now switches to the pushed branch itself, refusing to do so if
the server holds commits `main` does not.

---

## Rolling back a bad backend deploy

```bash
cd <DEPLOY_PATH>
git log --oneline -5
git revert <bad-sha> && git push     # safest — history stays honest
```

then re-run the workflow. If a migration caused the problem, restore the
pre-deploy SQL dump the script wrote to `../db-backups/`.

---

## Frontend deploys

Already automatic — Vercel builds on every push to `main` with root directory
`frontend`, output `dist`, and `frontend/vercel.json` handling SPA rewrites.
Nothing to do beyond keeping `VITE_API_URL` correct.

Useful checks after a deploy:

```bash
curl -sI https://tailor-web-app-iota.vercel.app/orders   # expect 200, not 404
```

A 404 on a nested route means `vercel.json` rewrites are not being applied —
usually the project Root Directory is not set to `frontend`.

---

## Scheduled cache flush

`CACHE_CRON.md` documents an hPanel cron running `schedule:run` every minute to
backstop the 3-day `cache:flush-app` task. The path it records,
`/home/u463999436/domains/darkred-mosquito-143226.hostingersite.com/laravel/backend/artisan`,
**is correct** — verified present on the server, and `schedule:list` reports
`0 3 */3 * * php artisan cache:flush-app` as registered.

Whether the hPanel cron itself is installed cannot be checked from the CLI
(`crontab` is not available to SSH users on this host), so confirm it in hPanel
→ **Advanced → Cron Jobs** if the flush is not observed.

