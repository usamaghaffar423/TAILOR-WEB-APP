# Backend Deployment — Hostinger Shared Hosting

Laravel 11 API for Top Man Tailor. This guide covers deploying `backend/` to
Hostinger shared hosting with a MySQL database on the same server.

---

## 1. Subdomain / Domain Setup

1. In hPanel, go to **Domains → Subdomains** (or use the main domain if the
   API lives at the root).
2. Create a subdomain, e.g. `api.yourdomain.com`.
3. Hostinger will create a folder for it, typically:
   ```
   domains/yourdomain.com/public_html/api/
   ```
4. **Set the document root to the `public/` subfolder of the Laravel app**,
   not the app root. In hPanel → **Domains → Subdomains → Manage → Document
   Root**, point it to:
   ```
   domains/yourdomain.com/public_html/api/backend/public
   ```
   This is the single most common source of a broken deploy on shared
   hosting — if the document root is the Laravel app root instead of
   `public/`, visitors can browse `.env`, `app/`, `vendor/`, etc.

## 2. Upload the Code

Upload everything **except** what's already in `.gitignore` (`vendor/`,
`.env`, `storage/logs`, etc.) via Git or SFTP into:
```
domains/yourdomain.com/public_html/api/backend/
```

If using Git, SSH in and clone directly (see below) rather than uploading a
zip — it's easier to redeploy later with `git pull`.

## 3. SSH Access

1. In hPanel → **Advanced → SSH Access**, enable SSH and note the port
   (Hostinger shared hosting typically uses a non-standard port).
2. Connect:
   ```bash
   ssh -p <port> u123456789@yourdomain.com
   ```
3. Navigate to the app:
   ```bash
   cd domains/yourdomain.com/public_html/api/backend
   ```

## 4. Install Dependencies

```bash
composer install --no-dev --optimize-autoloader
```
Shared hosting PHP CLI may point to an older PHP version than the one your
site actually runs — check with `php -v`. If it's wrong, Hostinger provides
version-specific binaries, e.g.:
```bash
/usr/bin/php8.2 /usr/bin/composer install --no-dev --optimize-autoloader
```

## 5. Environment File

```bash
cp .env.example .env
nano .env
```
Fill in real values — at minimum:
```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://app.yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1        # or the host hPanel shows under MySQL Databases
DB_DATABASE=<hostinger-generated db name>
DB_USERNAME=<hostinger-generated db user>
DB_PASSWORD=<the db password>

ADMIN_EMAIL=<real admin email>
ADMIN_PASSWORD=<a strong password — change after first login>
```
Never commit this file. `FRONTEND_URL` must exactly match the deployed
Vercel URL (scheme + host, no trailing slash) — CORS will silently reject
requests otherwise.

## 6. Generate the App Key

```bash
php artisan key:generate --force
```
`--force` is required because `APP_ENV=production` otherwise blocks it
interactively-guarded commands from running non-interactively.

## 7. Run Migrations

```bash
php artisan migrate --force
```
Same `--force` requirement in production.

## 8. Seed the Database

```bash
php artisan db:seed --force
```
This creates the admin user (from `ADMIN_EMAIL`/`ADMIN_PASSWORD`), the shop
settings row, and the 6 measurement templates. Only run this once — running
it again will fail on the unique admin email / template keys unless you've
wiped the tables first.

## 9. Storage Link

```bash
php artisan storage:link
```
This symlinks `public/storage` → `storage/app/public`, which is where order
photos and shop logo/banner uploads live. Without this, uploaded files save
successfully but every photo URL 404s.

## 10. File Permissions

```bash
chmod -R 755 storage bootstrap/cache
```
If the web server user differs from your SSH user (common on shared
hosting), you may also need:
```bash
chown -R $USER:$USER storage bootstrap/cache
```
Symptoms of wrong permissions: a blank white page or a 500 error with
"Permission denied" in `storage/logs/laravel.log`.

## 11. Config, Route, and View Caching

Do this **last**, after `.env` is final — cached config bakes in whatever
`.env` had at cache time:
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```
If you edit `.env` again after this, run `php artisan config:clear` first,
make the edit, then re-cache.

## 12. `.htaccess`

Laravel's default `public/.htaccess` handles URL rewriting for the built-in
Apache setup Hostinger uses. It should already exist from the Laravel
install; if it's missing (e.g. stripped during upload), recreate it:
```apache
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
```

---

## Verify the Deployment

Run these from any machine with `curl`, replacing the domain:

```bash
# 1. API root responds (Laravel bootstraps, DB reachable)
curl -s -o /dev/null -w "%{http_code}\n" https://api.yourdomain.com/api/auth/login
# Expect: 405 (GET not allowed on a POST-only route) or 422 — NOT 500

# 2. Login works end-to-end (app → DB → hashed token)
curl -s -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<ADMIN_EMAIL>","password":"<ADMIN_PASSWORD>"}'
# Expect: {"data":{"token":"...","admin":{...}},"message":"Login successful."}

# 3. No-token request is rejected correctly
curl -s -o /dev/null -w "%{http_code}\n" https://api.yourdomain.com/api/dashboard
# Expect: 401

# 4. CORS allows the deployed frontend origin
curl -s -I https://api.yourdomain.com/api/dashboard \
  -H "Authorization: Bearer <token from step 2>" \
  -H "Origin: https://app.yourdomain.com" | grep -i access-control-allow-origin
# Expect: Access-Control-Allow-Origin: https://app.yourdomain.com

# 5. Authenticated dashboard fetch actually hits the DB
curl -s https://api.yourdomain.com/api/dashboard \
  -H "Authorization: Bearer <token from step 2>"
# Expect: {"data":{"kpis":{...},"recentOrders":[...],...}}
```

If all five pass, the full chain (Apache → PHP → Laravel → MySQL → back out)
is confirmed live.

---

## Troubleshooting — Common Shared Hosting Issues

| Symptom | Likely Cause | Fix |
|---|---|---|
| Blank white page, no error | `APP_DEBUG=false` hiding a real error | Temporarily set `APP_DEBUG=true`, reload, check `storage/logs/laravel.log`, then set back to `false` |
| 500 error on every request | `storage/` or `bootstrap/cache/` not writable | `chmod -R 755 storage bootstrap/cache`, confirm ownership matches the web server user |
| 404 on every route except `/` | Document root points at the app root, not `public/` | Fix the subdomain's document root in hPanel |
| `.env` visible in browser at `/​.env` | Document root points at the app root, not `public/` | Same fix — this is a security-critical misconfiguration, rotate `APP_KEY` and DB password if this ever happened in production |
| "could not find driver" DB error | `pdo_mysql` PHP extension not enabled | hPanel → **Advanced → PHP Configuration** → enable `pdo_mysql` and `mysqli` |
| Config changes to `.env` don't take effect | Config was cached before the edit | `php artisan config:clear`, edit `.env`, `php artisan config:cache` again |
| CORS error in browser console, curl works fine | `FRONTEND_URL` in `.env` doesn't exactly match the deployed frontend origin | Fix scheme/host/trailing-slash mismatch, then `php artisan config:cache` |
| Uploaded photos save but URLs 404 | `storage:link` was never run, or the symlink didn't survive a redeploy | Re-run `php artisan storage:link`; some shared hosts don't preserve symlinks across file manager uploads — prefer SSH/Git for deploys |
| `composer install` fails or uses wrong PHP version | Shared hosting's default `php`/`composer` CLI binaries point at an old PHP version | Use the version-specific binary Hostinger provides, e.g. `/usr/bin/php8.2` |
| Migration fails with "Access denied for user" | Wrong `DB_HOST`, `DB_USERNAME`, or `DB_DATABASE` in `.env` | Re-check exact values from hPanel → **Databases → MySQL Databases** — Hostinger prefixes both the DB name and username with your account ID |
| Cron-dependent features silently don't run | No cron job configured | hPanel → **Advanced → Cron Jobs** → add `* * * * * php /path/to/backend/artisan schedule:run >> /dev/null 2>&1` (only needed if the app later adds scheduled tasks) |
