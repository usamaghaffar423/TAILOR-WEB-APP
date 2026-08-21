# SKILL: Top Man Tailor — Laravel 11 Backend
> Load this skill when working on anything inside the `backend/` directory.

## What This Project Is
A private tailor shop management REST API. Single admin user. No multi-tenancy.
Laravel 11 on Hostinger shared hosting. MySQL database. Stateless Bearer token auth.

## Stack Versions
- PHP 8.2
- Laravel 11 (no legacy `app/Http/Kernel.php` — uses bootstrap/app.php)
- MySQL 8.x via Eloquent
- No Sanctum, no Passport — plain hashed token in `admin.api_token`

## Project Root
`backend/` — all Laravel commands run from here.

## Absolute Rules

### Architecture
- All routes in `routes/api.php` only — no `routes/web.php` routes
- All controllers in `app/Http/Controllers/Api/` namespace
- Every route except `POST /api/auth/login` requires `ApiTokenAuth` middleware
- Never use sessions — fully stateless API
- JSON responses only — never return views or redirects from API controllers
- Always return consistent JSON shape: `{ data: ..., message: '...' }` for success, `{ message: '...', errors: {} }` for validation failures

### Auth
- Token stored as `hash('sha256', $plainToken)` in `admin.api_token`
- Login: generate `bin2hex(random_bytes(32))` → store hash → return plain token
- Middleware: hash incoming Bearer token → compare to `admin.api_token` — no timing attacks (use `hash_equals`)
- 401 response: `{ message: 'Unauthenticated.' }` — no other format

### Models & Database
- `measurement_snapshot` on orders is JSON — cast as `array` — NEVER update after order creation
- `style` on orders is JSON — cast as `array`
- `fields` on measurements and templates is JSON — cast as `array`
- `paid_amount` is NEVER stored — always use `SUM(payments.amount)` query
- `order_no` is generated in PHP: query MAX existing → increment → format as `ORD-XXXX`
- `customer_id` (display code) is generated in PHP: query MAX existing → format as `TMT-XXX`
- All soft deletes: do NOT use — hard delete only (simple app, not needed)
- All `->get()` calls on large tables must be filtered or paginated

### File Uploads
- Store in `storage/app/public/uploads/orders/{order_id}/`
- Serve via authenticated route — NEVER expose storage directly
- Max 5MB per file, images only (jpeg/png/webp/gif)
- Return `{ file_path: 'orders/123/uuid.jpg' }` — store relative path in DB
- `php artisan storage:link` required on deploy

### Validation
- Use Form Request classes for all POST/PUT — never validate in controller body
- Return 422 with `{ message, errors }` on validation failure (Laravel default)

### CORS
- `config/cors.php`: `allowed_origins` reads from `FRONTEND_URL` env var
- `allowed_methods: ['*']`, `allowed_headers: ['*']`, `supports_credentials: false`
- Never hardcode the Vercel URL in PHP code

### Error Handling
- Wrap all controller methods in try/catch for unexpected DB errors
- Return 500 `{ message: 'Server error.' }` — never expose stack traces in production
- Validation errors → 422 (Laravel handles automatically via Form Requests)
- Not found → 404 `{ message: 'Not found.' }`
- Unauthorized → 401 `{ message: 'Unauthenticated.' }`

## Response Formats

### Success (single resource)
```json
{ "data": { ...resource }, "message": "Created successfully." }
```

### Success (list)
```json
{ "data": [ ...resources ] }
```

### Dashboard (special shape)
```json
{
  "data": {
    "kpis": { "totalOrders": 0, "inProgress": 0, "dueThisWeek": 0, "pendingPayments": "0.00" },
    "recentOrders": [],
    "karigarWorkload": [],
    "deadlinesThisWeek": []
  }
}
```

### Error
```json
{ "message": "Human-readable message.", "errors": { "field": ["Error text."] } }
```

## Key Relationships
```
admin           (1) ──── (0) shop_settings
customers       (1) ──── (many) measurements      [UNIQUE customer_id+template_key]
customers       (1) ──── (many) orders
karigars        (1) ──── (many) orders
orders          (1) ──── (many) order_photos       [cascade delete]
orders          (1) ──── (many) payments           [cascade delete]
measurement_templates (1) — referenced by measurements.template_key (no FK, string key)
```

## Migration Run Order
1. `admin`
2. `shop_settings`
3. `customers`
4. `measurement_templates`
5. `measurements` (FK → customers)
6. `karigars`
7. `orders` (FK → customers, karigars)
8. `order_photos` (FK → orders, cascade)
9. `payments` (FK → orders, cascade)

## Seeder Requirements
`DatabaseSeeder` must create:
1. Admin row: email from `ADMIN_EMAIL` env (default `admin@topmantalor.com`), password from `ADMIN_PASSWORD` env (default `admin123`, bcrypt hashed)
2. ShopSettings row (id=1): name='Top Man Tailor', theme_default='dark'
3. All 6 default measurement templates with full field definitions (copy from ROADMAP.md Section 3)

## Environment Variables Required
```env
APP_NAME="Top Man Tailor"
APP_ENV=production
APP_KEY=                        # php artisan key:generate
APP_DEBUG=false
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://app.yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1               # local socket on shared hosting
DB_PORT=3306
DB_DATABASE=your_db_name
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password

ADMIN_EMAIL=admin@topmantalor.com
ADMIN_PASSWORD=change_me_on_first_deploy

FILESYSTEM_DISK=public
```

## Hostinger Deployment Notes
- Document root must point to `backend/public/` — not `backend/`
- Run `composer install --no-dev --optimize-autoloader` via SSH
- Run `php artisan storage:link` to create `public/storage` symlink
- PHP 8.2 must be selected in Hostinger panel for the subdomain
- `.htaccess` in `public/` handles routing (already in Laravel default)
