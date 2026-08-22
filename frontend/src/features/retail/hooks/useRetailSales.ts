import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { retailSalesApi } from '../api/sales';
import type { CreateSalePayload, SalesFilters } from '../api/sales';

export function useRetailSales(params: SalesFilters = {}) {
  return useQuery({
    queryKey: ['retail-sales', params],
    queryFn: () => retailSalesApi.list(params),
  });
}

export function useRetailSale(id: number | null) {
  return useQuery({
    queryKey: ['retail-sales', 'detail', id],
    queryFn: () => retailSalesApi.get(id as number),
    enabled: id !== null,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSalePayload) => retailSalesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retail-sales'] });
      queryClient.invalidateQueries({ queryKey: ['retail-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['retail-products'] });
      queryClient.invalidateQueries({ queryKey: ['retail-dashboard'] });
    },
  });
}
