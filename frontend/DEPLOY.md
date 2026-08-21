# Frontend Deployment — Vercel

React 19 + Vite SPA for Top Man Tailor. Deploys as static files — no
server-side rendering, no serverless functions.

---

## 1. Import the Repository

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub
   repo (`tailor-house` or whatever the repo is named).
2. This repo is a monorepo — `frontend/` and `backend/` both live at the
   root. Vercel needs to be told which subfolder to build.

## 2. Build Settings

In the import screen (or later under **Project Settings → General**), set:

| Setting | Value |
|---|---|
| **Root Directory** | `frontend` |
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

Setting **Root Directory** to `frontend` is the critical step for a
monorepo — without it, Vercel tries to build from the repo root, won't find
a `package.json` it recognizes as this app, and the build fails or builds
the wrong thing.

## 3. Environment Variable

Under **Project Settings → Environment Variables**, add:

| Key | Value | Environments |
|---|---|---|
| `VITE_API_URL` | `https://api.yourdomain.com` | Production, Preview, Development |

This must be the live Laravel API's public URL (no trailing slash). Vite
only reads `VITE_*` variables at **build time** — changing this value
requires a redeploy, not just a reload.

## 4. SPA Routing (`vercel.json`)

Already committed at `frontend/vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
This makes every URL (e.g. a direct load of `/orders/42`) serve
`index.html` so React Router can take over client-side, instead of Vercel's
CDN returning a 404 for any path that isn't a real static file.

## 5. Deploy

Push to the connected branch (or click **Deploy** in the dashboard).
Vercel builds and assigns a URL like `https://your-project.vercel.app`, plus
any custom domain you attach under **Project Settings → Domains**.

## 6. Verify the Deploy

1. Open the deployed URL directly — should redirect to `/login` (no
   token in a fresh browser).
2. **Hard-refresh a nested route directly**, e.g.
   `https://your-project.vercel.app/orders` — if this 404s, `vercel.json`
   isn't being picked up (confirm Root Directory is `frontend`, since
   Vercel only reads `vercel.json` from inside the configured root).
3. Open DevTools → Network, log in, and confirm requests go to the
   `VITE_API_URL` domain, not `localhost` — if they hit `localhost`, the
   env var wasn't set for the environment you're testing (Production vs.
   Preview) and the build used the fallback empty string.
4. Confirm no CORS errors in the console — the backend's `FRONTEND_URL`
   must exactly match this deployed origin (see `backend/DEPLOY.md`).

---

## Redeploying After Changes

Every push to the connected branch triggers a new build automatically. To
change `VITE_API_URL` (e.g. pointing at a new backend), update it in
**Project Settings → Environment Variables** and trigger a redeploy — env
var changes alone do not affect already-built deployments.
