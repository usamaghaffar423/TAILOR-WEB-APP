# Top Man Tailor — Project Roadmap & Clarity Document
> Engineering plan for Claude VS Code Extension execution.
> Stack: React 19 + Vite + TypeScript · Laravel 11 · MySQL · Hostinger Shared + Vercel Free

---

## 1. Project Summary

A private, single-owner tailor shop management system. Converts a fully-working
vanilla HTML/CSS/JS prototype (localStorage) into a production fullstack app
with a real database, authentication, and persistent cloud storage for photos.

**Users:** 1–10 (shop owner + staff). No public access. No SEO needed.
**Devices:** Desktop-first, mobile-responsive.
**Language mix:** English UI, Urdu/Pashto field labels preserved as-is from prototype.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
└───────────────┬─────────────────────────┬───────────────┘
                │                         │
                ▼                         ▼
   ┌────────────────────┐    ┌────────────────────────┐
   │   Vercel (Free)    │    │  Hostinger Shared Plan │
   │                    │    │                        │
   │  React 19 + Vite   │───►│  Laravel 11 REST API   │
   │  TypeScript SPA    │    │  api.yourdomain.com    │
   │  app.yourdomain.com│    │                        │
   └────────────────────┘    │  MySQL Database        │
                             │  (local socket)        │
                             │                        │
                             │  /storage/uploads/     │
                             │  (photo files on disk) │
                             └────────────────────────┘
```

### Why This Works
- React SPA on Vercel = free CDN, auto git-push deploys, no server needed
- Laravel on Hostinger = PHP runs on same machine as MySQL, no remote DB issue
- No Vercel → MySQL direct connection (that's the architecture that fails)
- CORS: Laravel allows Vercel domain, React sends Bearer token every request

---

## 3. Full Feature Inventory (from prototype)

### Pages (10 total)
| Page | Route | Key Features |
|------|-------|-------------|
| Login | `/login` | Email + password, JWT token, redirect |
| Dashboard | `/` | KPI cards, recent orders, karigar workload bars, deadlines this week |
| New Order | `/orders/new` | Customer search/autofill, template picker, measurements, style pickers, photo attach, karigar assign |
| Orders | `/orders` | Table with filters (status/karigar/date), inline status update, order card modal, WhatsApp send |
| Customer Detail | `/customers/:id` | Profile, all measurements per template, order history, print measurement sheet |
| Customers | `/customers` | Card grid, search, add customer modal |
| Karigar Detail | `/karigars/:id` | Profile, workload bar, assigned orders list, month filter |
| Karigars | `/karigars` | Card grid, add/edit karigar modal |
| Payments | `/payments` | KPI strip, order balances tab, payment history tab, add payment modal |
| Settings | `/settings` | Shop details, logo/banner upload, measurement template editor, theme picker, change password |

### Style Options (preserved exactly from prototype)
- **Regional:** Pukhtoon / Punjabi (controls which shalwar options appear)
- **Sleeve:** Straight / Regular / Slightly Tapered / Wide Traditional
- **Cuff:** Simple / Single Button / Double Button / Designer Cuff
- **Collar:** Classic Band / Simple / Chinese / Open / No Collar
- **Neck:** Round / V-Neck / Straight Opening / Traditional Opening
- **Length:** Short / Standard / Long / Extra Long
- **Placket:** Plain / Simple Button / Traditional Patti / Embroidered Patti / Designer Front / Custom
- **Pocket (Qameez):** No Pocket / 1 Chest / 2 Chest / 2 Side / 1 Chest + 2 Side
- **Daman:** Straight Hem / Round Hem / Side Slits (Chaak)
- **Pukhtoon Shalwar:** Traditional Wide / Extra Wide / Medium / Modern
- **Punjabi Shalwar:** Classic / Straight / Moderate / Narrow Modern
- **Mori:** Very Wide / Wide / Medium / Narrow / Custom
- **Waist Type:** Elastic / Nada / Button+Nada / Traditional
- **Fabric:** Wash & Wear / Cotton / Khaddar / Linen / Blended / Karandi / Premium / Customer Supplied
- **Button Style:** Standard / Premium / Wooden / Metal / Matching Fabric / Custom
- **Button Count:** 3 / 4 / 5 / Custom
- **Color:** 16 named hex swatches

### Measurement Templates (6)
1. Men's Shalwar Kameez — 24 fields (core + advanced disclosure)
2. Women's Shalwar Kameez — 24 fields (core + advanced disclosure)
3. Pant & Shirt — 8 fields
4. Coat — 6 fields
5. Waistcoat — 4 fields
6. Thobe — (defined in seed)

### Special Features
- **Order Card modal** — printable job card with measurements + style + payment summary
- **WhatsApp send** — `wa.me` link builder for karigar or customer audience
- **Print measurement sheet** — browser print with shop banner, hides app chrome
- **Live kameez SVG preview** — color dot updates kameez fill in real-time on new order form
- **Customer autofill** — searching existing customer pre-fills all fields + measurements
- **Advanced measurements disclosure** — `<details>` element, force-opened on print
- **Karigar workload bars** — active/maxCapacity progress bar per karigar
- **Photo attach** — multiple images per order, stored on Hostinger disk, served via authenticated Laravel route
- **Theme toggle** — dark (default) / light, sidebar always stays dark, persisted to cookie

---

## 4. Database Schema

### Tables (8)
```
admin               — id, email, password_hash, shop_name, created_at
shop_settings       — id(=1), name, address, phone, logo_path, banner_path,
                      theme_default, updated_at
customers           — id, customer_id(TMT-001), name, phone, address, created_at
measurement_templates — id, template_key, label, fields(JSON), updated_at
measurements        — id, customer_id(FK), template_key, fields(JSON), notes,
                      updated_at | UNIQUE(customer_id, template_key)
karigars            — id, name, phone, speciality, max_capacity, created_at
orders              — id, order_no(ORD-0001), customer_id(FK), style(JSON),
                      measurement_snapshot(JSON), karigar_id(FK),
                      assigned_date, deadline, status, delivered_date,
                      total_amount, created_at
order_photos        — id, order_id(FK cascade), file_path, uploaded_at
payments            — id, order_id(FK cascade), amount, method, date, note
```

### Key Design Decisions
- `measurement_snapshot` on orders is **frozen at creation** — never re-synced to later measurement edits
- `style` on orders is a JSON blob — not flat columns (option set keeps growing)
- `measurements` has UNIQUE(customer_id, template_key) — upsert pattern
- `payments.paid_amount` is **never stored** — always computed as SUM(payments.amount)
- `order_no` auto-increments as ORD-0001, ORD-0002... (application-level, not DB auto)
- `customer_id` auto-increments as TMT-001, TMT-002... (application-level)

---

## 5. API Contract

### Auth
```
POST   /api/auth/login          { email, password } → { token, admin }
POST   /api/auth/logout         Bearer token required
GET    /api/auth/me             Bearer token → { admin, shop }
```

### Dashboard
```
GET    /api/dashboard           → { kpis, recentOrders, karigarWorkload, deadlinesThisWeek }
```

### Orders
```
GET    /api/orders              ?status=&karigar_id=&q=&from=&to=
POST   /api/orders              Create order + optional first payment
GET    /api/orders/:id          Full order with customer + karigar + measurements + photos + payments
PATCH  /api/orders/:id/status   { status }
PUT    /api/orders/:id          Full edit
DELETE /api/orders/:id
```

### Customers
```
GET    /api/customers           ?q= (search by name/phone/customerId)
POST   /api/customers
GET    /api/customers/:id       With measurements + order history
PUT    /api/customers/:id
GET    /api/customers/:id/measurements
PUT    /api/customers/:id/measurements/:templateKey
```

### Karigars
```
GET    /api/karigars            With active order count
POST   /api/karigars
GET    /api/karigars/:id        With orders + workload, ?month=
PUT    /api/karigars/:id
DELETE /api/karigars/:id
```

### Payments
```
GET    /api/payments            ?q=&method=&from=&to=
POST   /api/payments            { order_id, amount, method, date, note }
GET    /api/payments/summary    → { thisWeek, thisMonth, allTime, totalPending }
GET    /api/payments/balances   → orders with pending amounts
```

### Settings
```
GET    /api/settings
PUT    /api/settings            { name, address, phone, theme_default }
POST   /api/settings/logo       multipart/form-data → { logo_path }
POST   /api/settings/banner     multipart/form-data → { banner_path }
GET    /api/templates
PUT    /api/templates/:key      { label, fields[] }
PUT    /api/auth/password       { current_password, new_password }
```

### Uploads
```
POST   /api/uploads/order/:id   multipart/form-data, multiple files → [{ file_path }]
GET    /api/uploads/*           Authenticated file serve (streams from disk)
DELETE /api/uploads/:photo_id
```

---

## 6. Frontend Structure

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts           # Base fetch: adds Bearer token, handles 401
│   │   ├── auth.ts
│   │   ├── dashboard.ts
│   │   ├── orders.ts
│   │   ├── customers.ts
│   │   ├── karigars.ts
│   │   ├── payments.ts
│   │   └── settings.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx    # Sidebar + topbar wrapper
│   │   │   ├── Sidebar.tsx
│   │   │   └── Topbar.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx       # progress/ready/delivered
│   │   │   ├── Dialog.tsx      # Generic modal
│   │   │   ├── Toast.tsx       # Sonner
│   │   │   ├── EmptyState.tsx
│   │   │   ├── KpiCard.tsx
│   │   │   └── StitchDivider.tsx
│   │   ├── garment/
│   │   │   ├── StyleChipPicker.tsx   # swatch-chip style
│   │   │   ├── StyleOptionPicker.tsx # illustrated cards
│   │   │   ├── ColorPicker.tsx       # color-dot swatches
│   │   │   └── GarmentPreview.tsx    # live SVG kameez
│   │   ├── measurements/
│   │   │   ├── MeasurementBlock.tsx       # read-only display
│   │   │   └── MeasurementFieldsForm.tsx  # editable inputs
│   │   ├── orders/
│   │   │   ├── OrderCardModal.tsx   # printable job card
│   │   │   ├── OrderRow.tsx
│   │   │   └── EditOrderModal.tsx
│   │   ├── customers/
│   │   │   ├── CustomerCard.tsx
│   │   │   └── AddCustomerModal.tsx
│   │   ├── karigars/
│   │   │   ├── KarigarCard.tsx
│   │   │   ├── AddKarigarModal.tsx
│   │   │   └── WorkloadBar.tsx
│   │   └── payments/
│   │       └── AddPaymentModal.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Orders.tsx
│   │   ├── NewOrder.tsx
│   │   ├── Customers.tsx
│   │   ├── CustomerDetail.tsx
│   │   ├── Karigars.tsx
│   │   ├── KarigarDetail.tsx
│   │   ├── Payments.tsx
│   │   └── Settings.tsx
│   ├── store/
│   │   └── auth.ts             # Zustand: token + admin info
│   ├── hooks/
│   │   └── useTitle.ts         # Sets document.title per page
│   ├── lib/
│   │   ├── styleOptions.ts     # All SLEEVE_OPTS, COLLAR_OPTS etc. — ported from prototype
│   │   ├── measurementTemplates.ts  # DEFAULT_TEMPLATES from seed.js
│   │   ├── whatsapp.ts         # buildOrderWhatsAppText()
│   │   └── formatters.ts       # formatCurrency, formatDate, timeGreeting
│   ├── types/
│   │   └── index.ts            # Order, Customer, Karigar, Payment, etc.
│   ├── App.tsx                 # React Router setup + auth guard
│   └── main.tsx
├── .env.local                  # VITE_API_URL=https://api.yourdomain.com
└── vite.config.ts
```

---

## 7. Backend Structure

```
backend/                        # Laravel 11
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   │   ├── AuthController.php
│   │   │   ├── DashboardController.php
│   │   │   ├── OrderController.php
│   │   │   ├── CustomerController.php
│   │   │   ├── KarigarController.php
│   │   │   ├── PaymentController.php
│   │   │   ├── SettingsController.php
│   │   │   └── UploadController.php
│   │   ├── Middleware/
│   │   │   └── ApiTokenAuth.php    # Validates Bearer token from admin table
│   │   └── Requests/               # Form Request validation classes
│   │       ├── StoreOrderRequest.php
│   │       ├── StoreCustomerRequest.php
│   │       ├── StorePaymentRequest.php
│   │       └── UpdateSettingsRequest.php
│   └── Models/
│       ├── Admin.php
│       ├── ShopSettings.php
│       ├── Customer.php
│       ├── MeasurementTemplate.php
│       ├── Measurement.php
│       ├── Karigar.php
│       ├── Order.php
│       ├── OrderPhoto.php
│       └── Payment.php
├── database/
│   ├── migrations/             # 8 migration files, numbered in dependency order
│   └── seeders/
│       └── DatabaseSeeder.php  # Admin + shop_settings + default templates
├── routes/
│   └── api.php                 # All endpoints, all behind auth middleware except login
├── config/
│   └── cors.php                # allow_origins: [VITE_APP_URL from .env]
├── storage/app/public/uploads/ # Order photos land here
└── .env                        # DB_*, APP_KEY, FRONTEND_URL, TOKEN_TTL_DAYS
```

---

## 8. Auth Flow

```
1. POST /api/auth/login { email, password }
   Laravel: bcrypt verify → generate random 64-char token →
   store hashed in admin.api_token → return plain token

2. React: store plain token in localStorage (key: 'tmt_token')
   Zustand auth store holds it in memory

3. Every API call: Authorization: Bearer <token> header
   Laravel middleware: hash incoming token → compare to admin.api_token

4. POST /api/auth/logout → nullify admin.api_token in DB
   React: clear Zustand + localStorage → redirect /login

5. Any 401 response → React api/client.ts clears auth + redirects /login
```

**Why not Sanctum?** Sanctum is perfect here but adds the `laravel_sanctum` table.
Plain hashed token in `admin` table is simpler for a single-admin app and zero
extra dependencies. Either works — Claude Code will use plain token by default.

---

## 9. Design System (Non-Negotiable — Port Exactly)

### Fonts (Google Fonts)
- `Bebas Neue` — hero titles, KPI numbers, brand name, nav wordmark
- `Inter` 400/500/600/700 — all body text, labels, buttons
- `IBM Plex Mono` — measurements, phone numbers, order numbers, money, dates

### Color Tokens
```css
/* Dark mode (default) */
--sidebar-bg: #0A0A0C      /* always dark */
--red: #E51A2E
--red-deep: #B4121F
--red-bright: #FF3348
--red-pale: rgba(229,26,46,0.12)
--bg: #0E0E10
--surface: #18181B
--surface-2: #202024
--text: #F2F2F4
--text-muted: #9B9BA3
--text-faint: #6C6C74
--border: rgba(255,255,255,0.08)
--border-strong: rgba(255,255,255,0.14)
--green: #3FBE7C
--amber: #E5A31A

/* Light mode — only main area switches, sidebar stays dark */
--bg: #F5F5F6
--surface: #FFFFFF
--surface-2: #FAFAFA
--text: #111113
--text-muted: #5C5C64
--text-faint: #8C8C94
--border: #E8E8EB
--border-strong: #DADADF
```

### Signature Elements
- **Stitch divider**: `repeating-linear-gradient(90deg, var(--red) 0 10px, transparent 10px 18px)` — 2px height — used under every page header
- **Card radius**: 16–18px
- **Brand mark**: red rounded square, initials or logo image
- **Status badges**: pill shape, color-coded (red/green/surface-2)

---

## 10. Build Phases (Claude Code execution order)

### Phase 1 — Backend Foundation
- [ ] Laravel 11 install + `.env` setup
- [ ] All 8 migrations (dependency order: admin → shop_settings → customers → templates → measurements → karigars → orders → order_photos → payments)
- [ ] All 9 Eloquent models with relationships
- [ ] Auth middleware (hashed token)
- [ ] `DatabaseSeeder`: admin row + shop_settings row + 6 default measurement templates
- [ ] `routes/api.php` skeleton (all routes registered, controllers return 501)
- [ ] CORS config

### Phase 2 — Backend Controllers
- [ ] AuthController (login / logout / me)
- [ ] DashboardController (single endpoint, all KPIs computed)
- [ ] CustomerController (CRUD + search + measurement upsert)
- [ ] KarigarController (CRUD + workload)
- [ ] OrderController (CRUD + status patch + next order number logic)
- [ ] PaymentController (record + list + summary + balances)
- [ ] SettingsController (shop + template CRUD)
- [ ] UploadController (store photo + authenticated serve + delete)

### Phase 3 — Frontend Scaffold
- [ ] Vite + React 19 + TypeScript + Tailwind v4
- [ ] CSS custom properties ported from shared.css exactly
- [ ] Google Fonts loaded (Bebas Neue + Inter + IBM Plex Mono)
- [ ] AppShell (Sidebar + Topbar) — pixel-matched to prototype
- [ ] React Router v7 setup
- [ ] Zustand auth store
- [ ] TanStack Query setup
- [ ] `api/client.ts` (base fetch with Bearer + 401 handler)
- [ ] All typed API modules

### Phase 4 — UI Components
- [ ] All /ui primitives (Button, Badge, Dialog, Toast, EmptyState, KpiCard, StitchDivider)
- [ ] Garment components (StyleChipPicker, StyleOptionPicker, ColorPicker, GarmentPreview SVG)
- [ ] Measurement components (MeasurementBlock read-only, MeasurementFieldsForm editable)
- [ ] Order components (OrderCardModal printable, OrderRow, EditOrderModal)
- [ ] Customer/Karigar/Payment components

### Phase 5 — Pages
- [ ] Login
- [ ] Dashboard
- [ ] Orders (list + filters)
- [ ] New Order (full form — largest page)
- [ ] Customer list
- [ ] Customer Detail (measurements + history + print)
- [ ] Karigar list
- [ ] Karigar Detail
- [ ] Payments
- [ ] Settings

### Phase 6 — Deploy
- [ ] Laravel → Hostinger (SSH, composer, migrate, symlink storage)
- [ ] `.htaccess` for Laravel public/ as document root on subdomain
- [ ] SSL cert on api subdomain (Let's Encrypt from Hostinger panel)
- [ ] React build → Vercel (GitHub repo, env vars set in Vercel dashboard)
- [ ] End-to-end smoke test: login → create order → add payment → print card

---

## 11. Deployment Checklist

### Hostinger (Laravel)
```
1. Create subdomain: api.yourdomain.com
2. Point subdomain document root → /public_html/api/public/
3. Upload Laravel project to /public_html/api/
4. SSH in: composer install --no-dev --optimize-autoloader
5. php artisan key:generate
6. php artisan migrate --force
7. php artisan db:seed --force
8. php artisan storage:link
9. Enable SSL (Let's Encrypt) from Hostinger panel for api subdomain
10. Set .env: APP_ENV=production, APP_DEBUG=false, FRONTEND_URL=https://app.yourdomain.com
```

### Vercel (React)
```
1. Push frontend/ to GitHub repo
2. Import repo in Vercel → set root directory to frontend/
3. Set env var: VITE_API_URL = https://api.yourdomain.com
4. Build command: npm run build  |  Output dir: dist
5. Vercel auto-deploys on every git push to main
```

---

## 12. Known Constraints & Decisions

| Constraint | Decision |
|-----------|----------|
| Hostinger shared blocks remote MySQL | Solved — PHP+MySQL on same server |
| No Node.js on Hostinger shared | Fine — Laravel is PHP only |
| Vercel serverless — no persistent disk | Fine — files on Hostinger, React is static |
| Photo storage | Hostinger disk via Laravel Storage, served authenticated |
| Single admin user | One row in `admin` table — no multi-user system needed |
| No Sanctum extra table | Plain hashed token in `admin.api_token` column |
| Tailwind v4 (no config file) | Use `@import "tailwindcss"` + CSS vars in index.css |
| TanStack Query | All data fetching — no manual loading state boilerplate |
| Zustand | Auth store only — no global state beyond token + admin info |
| React Router v7 | File-based routing not used — manual route config in App.tsx |
