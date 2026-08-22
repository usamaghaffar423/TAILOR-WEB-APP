import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/api/auth';
import { AppShell } from '@/components/layout/AppShell';
import { Toast } from '@/components/ui/Toast';
import { retailRoutes } from '@/features/retail/routes';

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
      <Toast />
    </QueryClientProvider>
  );
}
