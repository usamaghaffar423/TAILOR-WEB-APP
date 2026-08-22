import { useQuery } from '@tanstack/react-query';
import { retailDashboardApi } from '../api/dashboard';

export function useRetailDashboard() {
  return useQuery({
    queryKey: ['retail-dashboard'],
    queryFn: () => retailDashboardApi.summary(),
  });
}
