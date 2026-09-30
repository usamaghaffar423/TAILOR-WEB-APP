import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/api/auth';
import { AppShell } from '@/components/layout/AppShell';
import { Toast } from '@/components/ui/Toast';
import { retailRoutes } from '@/features/retail/routes';
import { healthRoutes } from '@/features/health/routes';

const Login       = lazy(() => import('@/pages/Login'));
const Dashboard   = lazy(() => import('@/pages/Dashboard'));
const Orders      = lazy(() => import('@/pages/Orders'));
const NewOrder    = lazy(() => import('@/pages/NewOrder'));
const Customers   = lazy(() => import('@/pages/Customers'));
const CustomerDetail = lazy(() => import('@/pages/CustomerDetail'));
const Karigars    = lazy(() => import('@/pages/Karigars'));
const KarigarDetail = lazy(() => import('@/pages/KarigarDetail'));
const Payments    = lazy(() => import('@/pages/Payments'));
const Settings    = lazy(() => import('@/pages/Settings'));
// Sale/Bill unification migration — new unified cart, not yet cut over to
// replace orders/new or retail/pos. Temporary test-only path until verified.
const NewSalePage = lazy(() => import('@/features/sales/pages/NewSalePage'));

// Theme initialisation — runs before first render
const savedTheme = localStorage.getItem('tmt_theme') as 'dark' | 'light' | null;
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 2 * 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

// Stale sessions are how "still broken" reports happen: an open tab keeps
// running the bundle it loaded hours ago, so fixes never reach it until the
// user happens to reload. Poll the shell for a newer build and offer a
// refresh — never force one, the user may have unsaved form state.
function useAppUpdateCheck() {
  useEffect(() => {
    const loaded = document.documentElement.outerHTML.match(/assets\/index-[\w-]+\.js/)?.[0];
    if (!loaded || import.meta.env.DEV) return;
    let notified = false;
    const check = async () => {
      if (notified) return;
      try {
        const res = await fetch(`/?build=${Date.now()}`, { cache: 'no-store' });
        const html = await res.text();
        const latest = html.match(/assets\/index-[\w-]+\.js/)?.[0];
        if (latest && latest !== loaded) {
          notified = true;
          toast.info('A newer version of the app is live', {
            description: 'Refresh to load the latest fixes.',
            duration: Infinity,
            action: { label: 'Refresh', onClick: () => window.location.reload() },
          });
        }
      } catch {
        // Offline or dev-server hiccup — silently retry on the next tick.
      }
    };
    const interval = setInterval(check, 60_000);
    const onVisible = () => { if (!document.hidden) check(); };
    document.addEventListener('visibilitychange', onVisible);
    check();
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
}

// Auth guard — wraps all protected routes. A token alone in localStorage
// doesn't carry the admin/shop payload, so hydrate it via /auth/me before
// rendering anything that depends on it (Sidebar brand, Topbar avatar).
function AuthGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const admin = useAuthStore((s) => s.admin);
  const setAuth = useAuthStore((s) => s.setAuth);

  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
    enabled: isAuthenticated && admin === null,
    retry: false,
  });

  useEffect(() => {
    if (data && token) {
      setAuth(token, data.data.admin, data.data.shop);
    }
  }, [data, token, setAuth]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (admin === null && isLoading) return null;

  return <Outlet />;
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={null}>
        <Login />
      </Suspense>
    ),
  },
  // Top-level, outside AuthGuard/AppShell — its own PIN gate is the security
  // boundary, and it must never show the app sidebar/topbar.
  ...healthRoutes,
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true,                  element: <Suspense fallback={null}><Dashboard /></Suspense> },
          { path: 'orders',               element: <Suspense fallback={null}><Orders /></Suspense> },
          { path: 'orders/new',           element: <Suspense fallback={null}><NewOrder /></Suspense> },
          { path: 'customers',            element: <Suspense fallback={null}><Customers /></Suspense> },
          { path: 'customers/:id',        element: <Suspense fallback={null}><CustomerDetail /></Suspense> },
          { path: 'karigars',             element: <Suspense fallback={null}><Karigars /></Suspense> },
          { path: 'karigars/:id',         element: <Suspense fallback={null}><KarigarDetail /></Suspense> },
          { path: 'payments',             element: <Suspense fallback={null}><Payments /></Suspense> },
          { path: 'settings',             element: <Suspense fallback={null}><Settings /></Suspense> },
          ...retailRoutes,
          { path: 'sales/new',            element: <Suspense fallback={null}><NewSalePage /></Suspense> },
          { path: '*',                    element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
]);

export default function App() {
  useAppUpdateCheck();
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toast />
    </QueryClientProvider>
  );
}
