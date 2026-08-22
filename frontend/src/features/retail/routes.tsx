import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';

const RetailDashboardPage = lazy(() => import('./pages/RetailDashboardPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const POSPage = lazy(() => import('./pages/POSPage'));
const SalesHistoryPage = lazy(() => import('./pages/SalesHistoryPage'));

export const retailRoutes: RouteObject[] = [
  { path: 'retail', element: <Suspense fallback={null}><RetailDashboardPage /></Suspense> },
  { path: 'retail/products', element: <Suspense fallback={null}><ProductsPage /></Suspense> },
  { path: 'retail/products/:id', element: <Suspense fallback={null}><ProductDetailPage /></Suspense> },
  { path: 'retail/inventory', element: <Suspense fallback={null}><InventoryPage /></Suspense> },
  { path: 'retail/pos', element: <Suspense fallback={null}><POSPage /></Suspense> },
  { path: 'retail/sales', element: <Suspense fallback={null}><SalesHistoryPage /></Suspense> },
];
