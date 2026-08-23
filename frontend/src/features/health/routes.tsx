import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';

const HealthDashboardPage = lazy(() => import('./pages/HealthDashboardPage'));

export const healthRoutes: RouteObject[] = [
  // No AuthGuard wrapper — page handles its own PIN gate.
  // URL is obscure by design — not linked from anywhere in the UI.
  { path: '/sys/health', element: <Suspense fallback={null}><HealthDashboardPage /></Suspense> },
];
