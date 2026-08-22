import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { retailInventoryApi } from '../api/inventory';

export function useRetailInventory(lowStockOnly = false) {
  return useQuery({
    queryKey: ['retail-inventory', lowStockOnly],
    queryFn: () => retailInventoryApi.list(lowStockOnly),
  });
}

export function useRetailMovements(variantId: number | null, page = 1) {
  return useQuery({
    queryKey: ['retail-movements', variantId, page],
    queryFn: () => retailInventoryApi.movements(variantId as number, page),
    enabled: variantId !== null,
  });
}

export function useRestock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, qty, note }: { variantId: number; qty: number; note?: string }) =>
      retailInventoryApi.restock(variantId, qty, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retail-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['retail-products'] });
      queryClient.invalidateQueries({ queryKey: ['retail-movements'] });
      queryClient.invalidateQueries({ queryKey: ['retail-dashboard'] });
    },
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, newQty, note }: { variantId: number; newQty: number; note: string }) =>
      retailInventoryApi.adjust(variantId, newQty, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retail-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['retail-products'] });
      queryClient.invalidateQueries({ queryKey: ['retail-movements'] });
      queryClient.invalidateQueries({ queryKey: ['retail-dashboard'] });
    },
  });
}
