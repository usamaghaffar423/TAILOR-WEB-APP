import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/store/auth';

// Pages — all lazy-loaded to keep initial bundle small
import { lazy, Suspense } from 'react';
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

// Theme initialisation — runs before first render
const savedTheme = localStorage.getItem('tmt_theme') as 'dark' | 'light' | null;
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

// Auth guard — wraps all protected routes
function AuthGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Placeholder shell — replace with real AppShell in Phase 4
function AppShell() {
  return (
    <div style={{ padding: '2rem', color: 'var(--text)' }}>
      <Outlet />
    </div>
  );
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
          { path: '*',                    element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid var(--border-strong)',
            borderLeft: '3px solid var(--red)',
          },
        }}
      />
    </QueryClientProvider>
  );
}
