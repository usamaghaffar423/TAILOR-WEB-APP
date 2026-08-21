import { apiFetch } from './client';
import type { DashboardData } from '@/types';

export const dashboardApi = {
  index: () => apiFetch<{ data: DashboardData }>('/dashboard'),
};
