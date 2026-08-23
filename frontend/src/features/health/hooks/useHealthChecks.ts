import { useCallback, useState } from 'react';
import type { CheckResult, CheckStatus, HealthCheck } from '../types';
import { CHECK_TIMEOUT_MS, RESPONSE_TIME_THRESHOLDS } from '../constants';

const API_URL = import.meta.env.VITE_API_URL ?? '';

const ALL_CHECKS: HealthCheck[] = [
  // Core
  { id: 'ping', label: 'Backend Reachable', endpoint: '/api/ping', method: 'GET', requiresAuth: false, module: 'core' },
  { id: 'auth_me', label: 'Auth / Session', endpoint: '/api/auth/me', method: 'GET', requiresAuth: true, module: 'core' },
  { id: 'settings', label: 'Shop Settings', endpoint: '/api/settings', method: 'GET', requiresAuth: true, module: 'core' },

  // Tailoring module
  { id: 'orders', label: 'Orders API', endpoint: '/api/orders', method: 'GET', requiresAuth: true, module: 'tailoring' },
  { id: 'customers', label: 'Customers API', endpoint: '/api/customers', method: 'GET', requiresAuth: true, module: 'tailoring' },
  { id: 'karigars', label: 'Karigars API', endpoint: '/api/karigars', method: 'GET', requiresAuth: true, module: 'tailoring' },
  { id: 'payments', label: 'Payments API', endpoint: '/api/payments', method: 'GET', requiresAuth: true, module: 'tailoring' },

  // Retail module
  { id: 'r_dash', label: 'Retail Dashboard', endpoint: '/api/retail/dashboard', method: 'GET', requiresAuth: true, module: 'retail' },
  { id: 'r_products', label: 'Products API', endpoint: '/api/retail/products', method: 'GET', requiresAuth: true, module: 'retail' },
  { id: 'r_inventory', label: 'Inventory API', endpoint: '/api/retail/inventory', method: 'GET', requiresAuth: true, module: 'retail' },
  { id: 'r_sales', label: 'Sales API', endpoint: '/api/retail/sales', method: 'GET', requiresAuth: true, module: 'retail' },
];

function resolveStatus(responseTimeMs: number | null, httpStatus: number | null, error: string | null): CheckStatus {
  if (error || httpStatus === null || httpStatus >= 500) return 'error';
  if (httpStatus === 401 || httpStatus === 403) return 'error'; // auth failure = error for health purposes
  if (httpStatus >= 400) return 'error';
  if (responseTimeMs === null) return 'error';
  if (responseTimeMs >= RESPONSE_TIME_THRESHOLDS.SLOW) return 'slow';
  if (responseTimeMs >= RESPONSE_TIME_THRESHOLDS.OK) return 'slow';
  return 'ok';
}

export function useHealthChecks(token: string | null) {
  const [results, setResults] = useState<Record<string, CheckResult>>({});
  const [running, setRunning] = useState(false);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);

  const runAll = useCallback(async () => {
    setRunning(true);

    const initial: Record<string, CheckResult> = {};
    for (const c of ALL_CHECKS) {
      initial[c.id] = { id: c.id, status: 'pending', httpStatus: null, responseTimeMs: null, error: null, checkedAt: new Date().toISOString() };
    }
    setResults({ ...initial });

    await Promise.allSettled(
      ALL_CHECKS.map(async (check) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
        const start = performance.now();

        try {
          const headers: Record<string, string> = { Accept: 'application/json' };
          if (check.requiresAuth && token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const res = await fetch(`${API_URL}${check.endpoint}`, {
            method: check.method,
            headers,
            signal: controller.signal,
            // Health checks measure real, current latency — never served
            // from TanStack Query (this hook doesn't use it) or the
            // browser's own HTTP cache.
            cache: 'no-store',
          });

          const elapsed = Math.round(performance.now() - start);
          clearTimeout(timer);

          const result: CheckResult = {
            id: check.id,
            status: resolveStatus(elapsed, res.status, null),
            httpStatus: res.status,
            responseTimeMs: elapsed,
            error: null,
            checkedAt: new Date().toISOString(),
          };

          setResults((prev) => ({ ...prev, [check.id]: result }));
        } catch (err: unknown) {
          clearTimeout(timer);
          const elapsed = Math.round(performance.now() - start);
          const isTimeout = err instanceof Error && err.name === 'AbortError';

          setResults((prev) => ({
            ...prev,
            [check.id]: {
              id: check.id,
              status: 'error',
              httpStatus: null,
              responseTimeMs: elapsed,
              error: isTimeout ? `Timeout after ${CHECK_TIMEOUT_MS}ms` : err instanceof Error ? err.message : 'Unknown error',
              checkedAt: new Date().toISOString(),
            },
          }));
        }
      })
    );

    setRunning(false);
    setLastRunAt(new Date().toISOString());
  }, [token]);

  return { checks: ALL_CHECKS, results, running, lastRunAt, runAll };
}

export { ALL_CHECKS };
