# SKILL: Top Man Tailor — React Frontend
> Load this skill when working on anything inside the `frontend/` directory.

## What This Project Is
A private SPA (Single Page App) for a tailor shop. No SSR. No public pages.
React 19 + Vite + TypeScript. Deployed as static files to Vercel.
Calls a Laravel REST API at `VITE_API_URL`.

## Stack Versions
- React 19
- Vite 6
- TypeScript 5.x (strict mode)
- Tailwind CSS v4 (`@import "tailwindcss"` — no tailwind.config.js)
- React Router v7 (createBrowserRouter)
- TanStack Query v5 (useQuery / useMutation)
- Zustand v5 (auth store only)
- Sonner (toasts)

## Project Root
`frontend/` — all npm commands run from here.

---

## Absolute Rules

### Design System — NON-NEGOTIABLE
The prototype design is approved and must be reproduced exactly.
Do NOT redesign, simplify, or modernize the visual style.
Every CSS variable below must exist in `src/index.css`.

**Fonts** — load from Google Fonts in `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

**CSS Custom Properties** (in `src/index.css`, `:root` block):
```css
@import "tailwindcss";

:root {
  --sidebar-bg: #0A0A0C;
  --sidebar-text: #A6A6AE;
  --sidebar-active-bg: #200F12;
  --red: #E51A2E;
  --red-deep: #B4121F;
  --red-bright: #FF3348;
  --red-pale: rgba(229,26,46,0.12);
  --bg: #0E0E10;
  --surface: #18181B;
  --surface-2: #202024;
  --text: #F2F2F4;
  --text-muted: #9B9BA3;
  --text-faint: #6C6C74;
  --border: rgba(255,255,255,0.08);
  --border-strong: rgba(255,255,255,0.14);
  --shadow: 0 24px 60px -24px rgba(0,0,0,0.65);
  --shadow-sm: 0 10px 26px -14px rgba(0,0,0,0.5);
  --green: #3FBE7C;
  --green-pale: rgba(46,158,99,0.14);
  --amber: #E5A31A;
  --amber-pale: rgba(229,163,26,0.14);
}

html[data-theme="light"] {
  --bg: #F5F5F6;
  --surface: #FFFFFF;
  --surface-2: #FAFAFA;
  --text: #111113;
  --text-muted: #5C5C64;
  --text-faint: #8C8C94;
  --border: #E8E8EB;
  --border-strong: #DADADF;
  --shadow: 0 20px 50px -24px rgba(20,20,25,0.16);
  --shadow-sm: 0 8px 20px -12px rgba(20,20,25,0.12);
  --red-pale: rgba(229,26,46,0.08);
}
/* sidebar always stays dark regardless of theme */
```

**Signature elements** (must appear exactly as in prototype):
- Stitch divider: `background-image: repeating-linear-gradient(90deg, var(--red) 0 10px, transparent 10px 18px)` — 2px height
- Bebas Neue for `.display` class: page titles, KPI numbers, brand name
- IBM Plex Mono for `.mono` class: measurements, phone numbers, order nos, amounts, dates
- Brand mark: red rounded square (8px radius), initials or shop logo image

### Component Rules
- Use CSS custom properties for ALL colors — never hardcode hex in components
- Tailwind utility classes are fine for spacing/layout — use CSS vars for colors
- Every component that shows data must handle `isLoading` and `error` states
- No `any` types in TypeScript — type everything
- No inline styles except for dynamic values (e.g., workload bar width percentage, color dot backgrounds)
- All modals use the `Dialog` component — never build one-off overlays
- All success/error feedback uses Sonner toasts — never alert() or console.log

### API Client Rules (`src/api/client.ts`)
```typescript
// Base fetch wrapper requirements:
// 1. Prepend VITE_API_URL to all paths
// 2. Set Authorization: Bearer <token> from Zustand auth store
// 3. Set Content-Type: application/json (except multipart uploads)
// 4. On 401 → clear auth store + navigate to /login
// 5. Throw typed ApiError on non-2xx responses
// 6. Never catch errors in the client — let TanStack Query handle them
```

### TanStack Query Rules
- All data fetching through `useQuery` / `useMutation` — no manual fetch in components
- Query keys: `['resource', id?, filters?]` format e.g. `['orders', { status, q }]`
- On mutation success: `queryClient.invalidateQueries(['orders'])` — always invalidate
- Loading states: show skeleton or spinner — never blank screen
- Error states: show inline error message — never crash

### Auth Rules
- Token stored in `localStorage` key `tmt_token`
- Zustand `useAuthStore` holds `{ token, admin, isAuthenticated }`
- `App.tsx` wraps all dashboard routes in `<AuthGuard>` that checks `isAuthenticated`
- `AuthGuard` redirects to `/login` if not authenticated
- Login page redirects to `/` if already authenticated

### Router Setup (`src/App.tsx`)
```typescript
// Routes:
// /login           — Login page (public)
// /                — Dashboard (protected)
// /orders          — Orders list (protected)
// /orders/new      — New Order form (protected)
// /customers       — Customers list (protected)
// /customers/:id   — Customer Detail (protected)
// /karigars        — Karigars list (protected)
// /karigars/:id    — Karigar Detail (protected)
// /payments        — Payments (protected)
// /settings        — Settings (protected)
// *                — Redirect to / (catch-all)
```

### Theme Toggle
- Persisted to `localStorage` key `tmt_theme`
- Applied as `data-theme="light"` attribute on `<html>` element
- Default: 'dark' (or from API `shop.themeDefault`)
- Sidebar background is ALWAYS dark — `var(--sidebar-bg)` is never overridden

### Print Styles (`src/index.css`)
```css
@media print {
  .sidebar, .topbar, .no-print { display: none !important; }
  .print-area, .print-area * { visibility: visible; }
  .print-area { position: absolute; left: 0; top: 0; width: 100%; }
  @page { margin: 16mm; }
}
```
`OrderCardModal` and Customer measurement print must work via `window.print()`.
Force open any `<details>` elements before print via `beforeprint` event listener.

---

## Key Library Patterns

### Sonner Toast
```typescript
import { toast } from 'sonner';
toast.success('Order saved.');
toast.error('Failed to save order.');
```
`<Toaster>` placed in `App.tsx` root.

### Zustand Auth Store
```typescript
// src/store/auth.ts
interface AuthStore {
  token: string | null;
  admin: Admin | null;
  setAuth: (token: string, admin: Admin) => void;
  clearAuth: () => void;
}
// Initialize from localStorage on store creation
```

### TanStack Query Provider
```typescript
// In App.tsx — wrap entire app
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } }
});
```

---

## Style Options Constants (`src/lib/styleOptions.ts`)
Must export these exactly — ported from prototype `shared.js`:
```typescript
export const SLEEVE_OPTS = ['Straight', 'Regular', 'Slightly Tapered', 'Wide Traditional'];
export const CUFF_OPTS = ['Simple', 'Single Button', 'Double Button', 'Designer Cuff'];
export const COLLAR_OPTS = ['Classic Band Collar', 'Simple Collar', 'Chinese Collar', 'Open Collar', 'No Collar'];
export const NECK_OPTS = ['Round', 'V-Neck', 'Straight Opening', 'Traditional Opening'];
export const LENGTH_OPTS = ['Short', 'Standard', 'Long', 'Extra Long'];
export const PLACKET_OPTS = ['Plain', 'Simple Button Placket', 'Traditional Patti', 'Embroidered Patti', 'Designer Front', 'Custom'];
export const POCKET_OPTS = ['No Pocket', '1 Chest Pocket', '2 Chest Pockets', '2 Side Pockets', '1 Chest + 2 Side'];
export const DAMAN_OPTS = ['Straight Hem', 'Round Hem', 'Side Slits (Chaak)'];
export const REGIONAL_OPTS = ['Pukhtoon', 'Punjabi'] as const;
export const PUKHTOON_SHALWAR_OPTS = ['Traditional Wide', 'Extra Wide Pukhtoon', 'Medium Width', 'Modern Pukhtoon'];
export const PUNJABI_SHALWAR_OPTS = ['Classic Punjabi', 'Straight Punjabi', 'Moderate Width', 'Narrow / Modern'];
export const MORI_OPTS = ['Very Wide', 'Wide', 'Medium', 'Narrow', 'Custom'];
export const WAIST_TYPE_OPTS = ['Elastic', 'Nada / Drawstring', 'Button + Nada', 'Traditional Waist'];
export const FABRIC_OPTS = ['Wash & Wear', 'Cotton', 'Khaddar', 'Linen', 'Blended', 'Karandi', 'Premium Wash & Wear', 'Customer Supplied'];
export const BUTTON_STYLE_OPTS = ['Standard', 'Premium', 'Wooden', 'Metal', 'Matching Fabric', 'Custom'];
export const BUTTON_COUNT_OPTS = ['3', '4', '5', 'Custom'];
export const COLOR_OPTS = [
  { hex: '#1a1a1a', name: 'Black' }, { hex: '#F2F2F4', name: 'White' },
  { hex: '#1F3A5F', name: 'Navy Blue' }, { hex: '#6E1F2A', name: 'Maroon' },
  { hex: '#254D32', name: 'Bottle Green' }, { hex: '#3A362F', name: 'Charcoal' },
  { hex: '#C9A227', name: 'Mustard / Gold' }, { hex: '#EDE3C8', name: 'Cream / Off-White' },
  { hex: '#B0532A', name: 'Rust / Brick' }, { hex: '#4A7FA5', name: 'Sky Blue' },
  { hex: '#6B3FA0', name: 'Purple' }, { hex: '#2E7D5E', name: 'Teal / Emerald' },
  { hex: '#8B0000', name: 'Dark Red' }, { hex: '#D4A5A5', name: 'Dusty Rose / Pink' },
  { hex: '#556B2F', name: 'Olive Green' }, { hex: '#4A3728', name: 'Brown' },
];
```

## TypeScript Types (`src/types/index.ts`)
All API response types must be defined here and imported — never inline.
Key types: `Admin`, `ShopSettings`, `Customer`, `Measurement`, `MeasurementTemplate`,
`Karigar`, `Order`, `OrderPhoto`, `Payment`, `OrderStatus`, `PaymentMethod`,
`OrderStyle`, `DashboardData`.

## Environment Variables
```env
# frontend/.env.local (dev)
VITE_API_URL=http://localhost:8000

# Vercel dashboard (production)
VITE_API_URL=https://api.yourdomain.com
```

## Vercel Deployment
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`
- No server-side rendering — pure static output
- SPA routing: add `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
This handles React Router client-side routing on Vercel.
