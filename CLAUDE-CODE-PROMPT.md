# Claude Code — Production Build Prompt
## Top Man Tailor — React + Laravel + MySQL

Paste this entire document as the first message to Claude Code in VS Code.
Run from the repo root: `tailor-house/`

---

## Context

You are building a production-grade tailor shop management system called
**Top Man Tailor**. A fully-working HTML/CSS/JS prototype exists in `prototype/`
— this is the approved design and feature reference. Your job is to convert it
into a proper fullstack app with a real database and REST API.

**Read these files before writing any code:**
1. `ROADMAP.md` — full project spec, all features, DB schema, API contract
2. `SKILL-backend.md` — Laravel rules, patterns, constraints
3. `SKILL-frontend.md` — React rules, design system, component patterns

**Never deviate from these documents.** If something is unclear, ask before building.

---

## Stack

```
Frontend: React 19 + Vite + TypeScript + Tailwind CSS v4
          Deployed to Vercel (static SPA)

Backend:  Laravel 11 + PHP 8.2
          Deployed to Hostinger shared hosting
          Document root → backend/public/

Database: MySQL 8 on Hostinger (same server as Laravel)
          Eloquent ORM, no Sanctum, plain hashed Bearer token auth
```

---

## Repo Structure to Create

```
tailor-house/
├── prototype/              ← READ ONLY. Do not modify. Design reference.
├── frontend/               ← React SPA
├── backend/                ← Laravel 11
├── ROADMAP.md
├── SKILL-backend.md
├── SKILL-frontend.md
└── CLAUDE-CODE-PROMPT.md
```

---

## Phase 1 — Backend Foundation (do this first, completely)

### Step 1.1 — Laravel Install
```bash
cd tailor-house/
composer create-project laravel/laravel backend --prefer-dist
cd backend
```

### Step 1.2 — Clean Up Laravel Defaults
Remove files not needed for a pure API:
- `resources/views/welcome.blade.php` — delete
- `routes/web.php` — delete its contents, keep file empty or remove routes
- Keep: `routes/api.php`, `routes/console.php`

### Step 1.3 — Environment File
Create `backend/.env` with these keys (use placeholder values — operator fills real values):
```
APP_NAME="Top Man Tailor"
APP_ENV=production
APP_KEY=                    # will be generated
APP_DEBUG=false
APP_URL=https://api.yourdomain.com

FRONTEND_URL=https://app.yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=tailor_db
DB_USERNAME=tailor_user
DB_PASSWORD=your_db_password

FILESYSTEM_DISK=public

ADMIN_EMAIL=admin@topmantalor.com
ADMIN_PASSWORD=ChangeMe123!
```

Also create `backend/.env.example` with the same keys but all values blank or clearly labeled as placeholders.

### Step 1.4 — Migrations
Create exactly these 9 migration files in order. Use `php artisan make:migration` naming convention.

**Migration 1: create_admin_table**
```php
Schema::create('admin', function (Blueprint $table) {
    $table->id();
    $table->string('email')->unique();
    $table->string('password_hash');
    $table->string('api_token', 64)->nullable()->unique(); // plain SHA-256 hex stored here
    $table->string('shop_name', 255)->default('Top Man Tailor');
    $table->timestamps();
});
```

**Migration 2: create_shop_settings_table**
```php
Schema::create('shop_settings', function (Blueprint $table) {
    $table->unsignedTinyInteger('id')->primary(); // always 1
    $table->string('name', 255)->default('Top Man Tailor');
    $table->string('address', 500)->nullable();
    $table->string('phone', 50)->nullable();
    $table->string('logo_path', 500)->nullable();
    $table->string('banner_path', 500)->nullable();
    $table->enum('theme_default', ['dark', 'light'])->default('dark');
    $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
});
```

**Migration 3: create_customers_table**
```php
Schema::create('customers', function (Blueprint $table) {
    $table->id();
    $table->string('customer_id', 20)->unique(); // TMT-001
    $table->string('name', 255);
    $table->string('phone', 50);
    $table->string('address', 500)->nullable();
    $table->timestamps();
});
```

**Migration 4: create_measurement_templates_table**
```php
Schema::create('measurement_templates', function (Blueprint $table) {
    $table->id();
    $table->string('template_key', 60)->unique(); // 'shalwar-kameez-men'
    $table->string('label', 255);
    $table->json('fields'); // [{key, label, group?, advanced?}]
    $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
});
```

**Migration 5: create_measurements_table**
```php
Schema::create('measurements', function (Blueprint $table) {
    $table->id();
    $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
    $table->string('template_key', 60);
    $table->json('fields'); // { fieldKey: value }
    $table->string('notes', 1000)->nullable();
    $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
    $table->unique(['customer_id', 'template_key']);
});
```

**Migration 6: create_karigars_table**
```php
Schema::create('karigars', function (Blueprint $table) {
    $table->id();
    $table->string('name', 255);
    $table->string('phone', 50)->nullable();
    $table->string('speciality', 255)->nullable();
    $table->unsignedSmallInteger('max_capacity')->default(6);
    $table->timestamps();
});
```

**Migration 7: create_orders_table**
```php
Schema::create('orders', function (Blueprint $table) {
    $table->id();
    $table->string('order_no', 20)->unique(); // ORD-0001
    $table->foreignId('customer_id')->constrained('customers');
    $table->json('style');                    // OrderStyle shape
    $table->json('measurement_snapshot');     // frozen at creation
    $table->foreignId('karigar_id')->constrained('karigars');
    $table->date('assigned_date');
    $table->date('deadline');
    $table->enum('status', ['progress', 'ready', 'delivered'])->default('progress');
    $table->date('delivered_date')->nullable();
    $table->decimal('total_amount', 10, 2);
    $table->timestamps();
    $table->index('customer_id');
    $table->index('karigar_id');
    $table->index('status');
    $table->index('deadline');
});
```

**Migration 8: create_order_photos_table**
```php
Schema::create('order_photos', function (Blueprint $table) {
    $table->id();
    $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
    $table->string('file_path', 500);
    $table->timestamp('uploaded_at')->useCurrent();
    $table->index('order_id');
});
```

**Migration 9: create_payments_table**
```php
Schema::create('payments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
    $table->decimal('amount', 10, 2);
    $table->enum('method', ['cash', 'easypaisa', 'jazzcash', 'bank']);
    $table->date('date');
    $table->string('note', 500)->nullable();
    $table->index('order_id');
    $table->index('date');
});
```

### Step 1.5 — Eloquent Models
Create all 9 models with correct relationships, fillable fields, and casts.
Follow rules in SKILL-backend.md exactly.

Key casts to include:
- `Order`: `style => 'array'`, `measurement_snapshot => 'array'`
- `Measurement`: `fields => 'array'`
- `MeasurementTemplate`: `fields => 'array'`

### Step 1.6 — Auth Middleware
Create `app/Http/Middleware/ApiTokenAuth.php`:
- Read `Authorization: Bearer <token>` header
- `hash('sha256', $token)` → compare to `admin.api_token` using `hash_equals()`
- If no match: return `response()->json(['message' => 'Unauthenticated.'], 401)`
- If match: attach admin to `$request->admin`
- Register in `bootstrap/app.php` as route middleware alias `'api.auth'`

### Step 1.7 — CORS Config
`config/cors.php`:
```php
'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
'exposed_headers' => [],
'max_age' => 0,
'supports_credentials' => false,
```
In `bootstrap/app.php`, register `HandleCors` middleware globally.

### Step 1.8 — Routes Skeleton
`routes/api.php` — register all routes (see ROADMAP.md Section 5 for full list).
All routes except `POST /auth/login` use `middleware('api.auth')`.
Controllers return `response()->json(['message' => 'Not implemented.'], 501)` at this stage.

### Step 1.9 — Database Seeder
`database/seeders/DatabaseSeeder.php`:
1. Create admin from `ADMIN_EMAIL` + `ADMIN_PASSWORD` env vars
2. Create ShopSettings row (id=1)
3. Create all 6 measurement templates with full field arrays from ROADMAP.md Section 3

---

## Phase 2 — Backend Controllers (implement all endpoints)

Implement each controller fully. Follow response format in SKILL-backend.md.

### AuthController
- `login`: validate email+password, bcrypt verify, generate token, store hash, return plain token + admin
- `logout`: null out api_token, return 200
- `me`: return `$request->admin` + shop settings merged

### DashboardController
Single `index` method. Compute all in one method:
- `totalOrders`: COUNT orders
- `newThisWeek`: COUNT orders where created_at >= last Monday
- `inProgress`: COUNT orders where status='progress'
- `karigarCount`: COUNT distinct karigar_id where status='progress'
- `dueThisWeek`: COUNT orders where deadline BETWEEN today AND next Sunday AND status != 'delivered'
- `dueTomorrow`: COUNT orders where deadline = tomorrow
- `pendingPayments.totalPending`: SUM(total_amount) - SUM(payments.amount) across all non-delivered orders
- `pendingPayments.orderCount`: COUNT orders with pending > 0
- `recentOrders`: 8 most recent orders with customer name + status
- `karigarWorkload`: all karigars with active order count + max_capacity
- `deadlinesThisWeek`: orders due this week (not delivered) with customer name

### CustomerController
- `index`: search by name/phone/customer_id via `?q=` param
- `store`: validate, generate next TMT-XXX code (query MAX, increment), create
- `show`: with measurements (all templates) + orders (with karigar name + paid amount)
- `update`: validate, update
- `getMeasurements`: return all measurements for customer
- `upsertMeasurement($id, $templateKey)`: INSERT ... ON DUPLICATE KEY UPDATE (use Eloquent updateOrCreate)

### KarigarController
- `index`: with active order count (status != 'delivered')
- `store`, `update`, `destroy`: standard CRUD
- `show`: karigar + orders filtered by optional `?month=YYYY-MM` param, with customer names + paid amounts

### OrderController
- `index`: filterable by `?status=&karigar_id=&q=&from=&to=`
  - `q` searches order_no and customer name (JOIN customers)
  - Always include: customer name+phone, karigar name, paid_amount (subquery SUM)
- `store`:
  1. Validate all fields
  2. Generate next ORD-XXXX (query MAX order_no, increment)
  3. Resolve measurement snapshot: fetch customer's measurement for the template, freeze it
  4. Create order
  5. If advance payment provided in request: create payment record
  6. Return order with relationships
- `show`: full order with customer + karigar + measurement_snapshot + photos + payments
- `updateStatus($id)`: PATCH — only update status field, set delivered_date if status='delivered'
- `update($id)`: full PUT update (not measurement_snapshot — that's frozen)
- `destroy($id)`: delete order (photos cascade via DB)

### PaymentController
- `index`: filter by `?method=&from=&to=&q=` (q searches order_no/customer name)
  - JOIN orders JOIN customers — return enriched list
- `store`: validate, create payment, return updated order balance
- `summary`: week/month/all-time totals + total pending across all orders
- `balances`: orders with pending amount > 0, sorted by deadline

### SettingsController
- `show`: return shop_settings row (id=1)
- `update`: update name/address/phone/theme_default
- `uploadLogo`: store image → `uploads/shop/logo.{ext}`, update logo_path
- `uploadBanner`: store image → `uploads/shop/banner.{ext}`, update banner_path
- `getTemplates`: return all measurement_templates
- `updateTemplate($key)`: update label + fields JSON for given template_key
- `changePassword`: verify current_password, bcrypt new, update admin.password_hash

### UploadController
- `store($orderId)`: receive multiple files, validate (image only, max 5MB each),
  store to `uploads/orders/{orderId}/{uuid}.{ext}`, create OrderPhoto records, return paths
- `serve($path)`: stream file from storage with correct Content-Type (authenticated)
- `destroy($photoId)`: delete DB record + file from disk

---

## Phase 3 — Frontend Scaffold

### Step 3.1 — Vite Project
```bash
cd tailor-house/
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install react-router-dom @tanstack/react-query zustand sonner
npm install -D tailwindcss @tailwindcss/vite
```

### Step 3.2 — Vite Config
`frontend/vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

### Step 3.3 — CSS Foundation
`frontend/src/index.css`:
- All CSS custom properties from SKILL-frontend.md (copy exactly)
- Light theme overrides under `html[data-theme="light"]`
- `.display` class: `font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.02em`
- `.mono` class: `font-family: 'IBM Plex Mono', monospace`
- Stitch divider class `.stitch`
- Print media query (from SKILL-frontend.md)
- Base resets: `*, html, body` box-sizing, height, background, color, font-family

### Step 3.4 — index.html
Add Google Fonts link tag. Set `<title>Top Man Tailor</title>`.
Set `<meta name="theme-color" content="#0A0A0C">`.

### Step 3.5 — TypeScript Types
Create `frontend/src/types/index.ts` with all types.
Every API response shape must be typed.

### Step 3.6 — Style Options Constants
Create `frontend/src/lib/styleOptions.ts`.
Copy all option arrays from SKILL-frontend.md exactly — do not abbreviate.

### Step 3.7 — API Client
`frontend/src/api/client.ts`:
- `apiFetch(path, options)` base function
- Reads `VITE_API_URL` from `import.meta.env`
- Auto-attaches Bearer token from Zustand store
- Handles 401 → clears auth + redirect
- Throws typed error on non-2xx

### Step 3.8 — Typed API Modules
Create `frontend/src/api/{auth,dashboard,orders,customers,karigars,payments,settings}.ts`
Each exports typed functions used by TanStack Query hooks.

### Step 3.9 — Zustand Auth Store
`frontend/src/store/auth.ts` — see SKILL-frontend.md for shape.
Initialize from localStorage on store creation.

### Step 3.10 — App.tsx
- QueryClientProvider wrapping everything
- `<Toaster>` from sonner
- React Router `createBrowserRouter` with all routes
- `AuthGuard` component wrapping all dashboard routes
- Theme initialization: read `tmt_theme` from localStorage, apply to `<html>`

---

## Phase 4 — UI Components

Build all components in this order (each must be complete before moving on):

### 4.1 — Primitives (`src/components/ui/`)
- `StitchDivider.tsx` — the red dashed line, used under every page header
- `Button.tsx` — variants: primary, outline, sm, danger, disabled state
- `Badge.tsx` — progress (red), ready (green), delivered (surface-2)
- `KpiCard.tsx` — red corner tag, Bebas Neue number, sub text
- `EmptyState.tsx` — centered icon + title + subtitle
- `Dialog.tsx` — modal overlay, box, head, close button, body, foot
- `Toast.tsx` — configure Sonner `<Toaster>` with correct theme colors

### 4.2 — Layout (`src/components/layout/`)
- `Sidebar.tsx` — pixel-match to prototype: brand mark, nav items with active state, sidebar-foot
- `Topbar.tsx` — hamburger, search box (global, non-functional in v1), theme toggle, bell, avatar
- `AppShell.tsx` — wraps Sidebar + Topbar + `<main>` content area, handles mobile overlay

### 4.3 — Garment (`src/components/garment/`)
- `StyleChipPicker.tsx` — `swatch-chip` style buttons for text options (fabric, length, etc.)
- `StyleOptionPicker.tsx` — illustrated card grid with SVG icons for collar/sleeve/etc.
  - Port ALL SVG icons from prototype `shared.js` `COLLAR_ICON`, `SLEEVE_ICON` etc.
- `ColorPicker.tsx` — 16 color dots, selected ring effect
- `GarmentPreview.tsx` — live SVG kameez silhouette that updates fill color on selection

### 4.4 — Measurements (`src/components/measurements/`)
- `MeasurementBlock.tsx` — read-only grouped display (Qameez group / Shalwar group / Advanced)
- `MeasurementFieldsForm.tsx` — editable inputs grouped by template, advanced fields in `<details>`

### 4.5 — Orders (`src/components/orders/`)
- `OrderRow.tsx` — table row with customer/karigar/deadline/status/actions
- `OrderCardModal.tsx` — printable job card: measurements + style icons + payment summary + WhatsApp buttons + Print button
- `EditOrderModal.tsx` — edit order status/deadline/karigar/total amount

### 4.6 — Customers (`src/components/customers/`)
- `CustomerCard.tsx` — entity card with avatar, name, phone, order count stats
- `AddCustomerModal.tsx` — name, phone, address fields

### 4.7 — Karigars (`src/components/karigars/`)
- `KarigarCard.tsx` — entity card with workload bar
- `AddKarigarModal.tsx` / `EditKarigarModal.tsx`

### 4.8 — Payments (`src/components/payments/`)
- `AddPaymentModal.tsx` — order selector (or pre-set order_id), amount, method, date, note

---

## Phase 5 — Pages

Build pages in this order. Each page uses TanStack Query for data.

### Login (`/login`)
- Email + password form
- POST `/api/auth/login`
- On success: store token, redirect to `/`
- Show error on invalid credentials

### Dashboard (`/`)
- GET `/api/dashboard`
- 4 KPI cards: Total Orders / In Progress / Due This Week / Pending Payments
- Recent Orders panel (8 rows, clickable → OrderCardModal)
- Karigar Workload panel (workload bars)
- Deadlines This Week panel (date boxes + order rows)

### Orders (`/orders`)
- GET `/api/orders` with filter params
- Filter bar: status select / karigar select / search input / date range
- Inline status select on each row (PATCH on change)
- Row actions: View Card (→ OrderCardModal), WhatsApp send, Edit
- Empty state if no orders

### New Order (`/orders/new`)
This is the most complex page. Match the prototype exactly.
- Section 1: Customer search with autofill dropdown
- Section 2: Customer details (name, phone, address, auto customer_id)
- Section 3: Garment template selector (dropdown)
- Section 4: Measurements — dynamic fields based on selected template
  - Standard fields + Advanced disclosure for shalwar-kameez templates
  - Pukhtoon/Punjabi regional split for shalwar options
- Section 5: Style customization
  - Regional selector (Pukhtoon/Punjabi) — controls shalwar section visibility
  - Sleeve, Cuff, Collar, Neck (StyleOptionPicker illustrated cards)
  - Length, Fit (StyleChipPicker)
  - Placket, Pocket, Daman (StyleChipPicker)
  - Pukhtoon OR Punjabi shalwar options (conditional)
  - Mori + Waist Type (conditional on Pukhtoon)
  - Fabric, Button Style, Button Count (StyleChipPicker)
  - Color swatches (ColorPicker)
  - Live garment preview (GarmentPreview — right panel, kameez only)
- Section 6: Photo attach (drag & drop + click, multiple files, thumbnails)
- Section 7: Assign & Deadline
  - Karigar select, deadline date, order status
  - Total amount + Advance paid fields
- Save: POST `/api/orders` then POST `/api/uploads/order/:id` for photos

### Customers (`/customers`)
- GET `/api/customers?q=`
- Search bar + card grid
- Add Customer button → AddCustomerModal

### Customer Detail (`/customers/:id`)
- GET `/api/customers/:id`
- Customer profile header
- Measurements section: tab per template, editable, PUT to upsert
- Order history: list with status badges + View Card links
- Print button → `window.print()` (print-area shows measurement sheet with shop banner)

### Karigars (`/karigars`)
- GET `/api/karigars`
- Card grid with workload bars
- Add Karigar button

### Karigar Detail (`/karigars/:id`)
- GET `/api/karigars/:id?month=`
- Karigar profile + workload bar
- Month filter (select)
- Assigned orders list

### Payments (`/payments`)
- GET `/api/payments/summary` + GET `/api/payments/balances` + GET `/api/payments`
- KPI strip: this week / this month / all time / total pending
- Tab toggle: Order Balances / Payment History
- Order Balances: table of orders with pending amounts + Add Payment button
- Payment History: table with filters (method, date range, search)
- AddPaymentModal: POST `/api/payments`

### Settings (`/settings`)
- GET `/api/settings` + GET `/api/templates`
- Shop Details form: name, address, phone
- Logo upload: file input → POST `/api/settings/logo`
- Banner upload: file input → POST `/api/settings/banner`
- Measurement Template Editor: for each template, edit label + reorder/add/remove fields
- Theme Default picker: dark/light chips
- Change Password: current + new password fields
- Karigar management link → `/karigars`

---

## Phase 6 — Deploy Prep

### Backend
Create `backend/DEPLOY.md` with exact steps:
1. SSH into Hostinger
2. Navigate to correct directory
3. `composer install --no-dev --optimize-autoloader`
4. `php artisan key:generate --force`
5. `php artisan migrate --force`
6. `php artisan db:seed --force`
7. `php artisan storage:link`
8. Set file permissions: `chmod -R 755 storage bootstrap/cache`

Create `backend/public/.htaccess` if not present (Laravel default handles this).

### Frontend
Create `frontend/vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Create `frontend/.env.example`:
```
VITE_API_URL=https://api.yourdomain.com
```

---

## Quality Standards

Every file you generate must meet these standards:

1. **TypeScript**: strict mode, no `any`, all props typed
2. **Error handling**: every API call has error state, every form has validation feedback
3. **Loading states**: every data-dependent component shows a spinner/skeleton while loading
4. **Empty states**: every list shows `EmptyState` when data is empty
5. **Mobile**: sidebar collapses at 760px breakpoint, content reflows, hamburger shows
6. **Print**: OrderCard and measurement sheet work correctly with `window.print()`
7. **No hardcoded colors**: all colors through CSS custom properties
8. **No console.log in production code**: use proper error handling
9. **Accessibility**: all interactive elements have aria-labels or visible labels, focus-visible styles
10. **Consistency**: every page header uses the same pattern: eyebrow text + Bebas Neue title + StitchDivider

---

## Start Command

Begin with Phase 1 Step 1.1. Complete each step fully before moving to the next.
After completing Phase 1, confirm with me before starting Phase 2.
After completing Phase 2, test all API endpoints before starting Phase 3.
Build incrementally. Do not skip phases.
