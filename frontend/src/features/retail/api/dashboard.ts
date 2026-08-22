import { apiFetch } from '@/api/client';
import type { RetailDashboardSummary } from '../types';

export const retailDashboardApi = {
  summary: () => apiFetch<{ data: RetailDashboardSummary }>('/retail/dashboard'),
};
