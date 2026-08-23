# Scheduled Cache Flush — Cron Setup

The app now has a scheduled task that flushes the application cache every
3 days at 3 AM (`php artisan cache:flush-app`, registered in
`backend/bootstrap/app.php` via `withSchedule()`). This is a safety net on
top of the cache invalidation every write already does automatically —
it just clears out anything that was ever orphaned.

**Laravel's scheduler does not run itself.** It only decides *what* to run
and *when* — something on the server has to actually invoke it once a
minute so it can check whether anything is due. That "something" is a single
cron job pointed at `php artisan schedule:run`, not at the cache command
directly.

## Steps (Hostinger hPanel)

1. Log in to hPanel → **Advanced** → **Cron Jobs**.
2. Add a new cron job with:
   - **Common Settings**: `Every Minute` (`* * * * *`)
   - **Command**:
     ```
     php /home/u463999436/domains/darkred-mosquito-143226.hostingersite.com/laravel/backend/artisan schedule:run >> /dev/null 2>&1
     ```
     Adjust the path if the backend ever moves — it must point at the
     `artisan` file inside `backend/`, not the repo root (this is a
     monorepo; `artisan` only exists under `backend/`).
   - If hPanel's cron UI asks you to pick a PHP version separately from
     the command line, choose the same version the site actually runs on
     (currently PHP 8.3 — check `GET /api/ping` if unsure, it reports
     `php_version` live).
3. Save. That's it — no further configuration needed.

## Why "every minute" is correct, not wasteful

The cron line above runs every minute, but it does almost nothing on most
of those runs. `schedule:run` just checks Laravel's internal schedule
(defined in `bootstrap/app.php`) and exits immediately unless something is
actually due. The cache flush itself only *executes* once every 3 days at
3 AM — the cron ticking every minute is just how Laravel's scheduler is
designed to work; the timing precision lives in the PHP code, not in cron
expressions scattered across hPanel.

## Verifying it's working

SSH in and run:

```bash
cd /home/u463999436/domains/darkred-mosquito-143226.hostingersite.com/laravel/backend
php artisan schedule:list
```

This shows every scheduled task and when it's next due — confirm
`cache:flush-app` appears with the `0 3 */3 * *` expression. To confirm the
command itself works (independent of the cron job), run it directly:

```bash
php artisan cache:flush-app
```

It should print `Application cache flushed.` and exit successfully.
