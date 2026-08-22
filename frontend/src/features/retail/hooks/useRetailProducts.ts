import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { retailProductsApi } from '../api/products';
import type { CreateRetailProductPayload, UpdateRetailProductPayload } from '../api/products';

export function useRetailProducts() {
  return useQuery({
    queryKey: ['retail-products'],
    queryFn: () => retailProductsApi.list(),
  });
}

export function useRetailProduct(id: number | null) {
  return useQuery({
    queryKey: ['retail-products', id],
    queryFn: () => retailProductsApi.get(id as number),
    enabled: id !== null,
  });
}

export function useCreateRetailProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRetailProductPayload) => retailProductsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retail-products'] });
    },
  });
}

export function useUpdateRetailProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateRetailProductPayload }) =>
      retailProductsApi.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['retail-products'] });
      queryClient.invalidateQueries({ queryKey: ['retail-products', variables.id] });
    },
  });
}

export function useDeactivateRetailProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => retailProductsApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retail-products'] });
    },
  });
}

export function useAddRetailVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, data }: { productId: number; data: { size?: string; color?: string } }) =>
      retailProductsApi.addVariant(productId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['retail-products'] });
      queryClient.invalidateQueries({ queryKey: ['retail-products', variables.productId] });
    },
  });
}

export function useUploadVariantImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, file }: { variantId: number; file: File }) =>
      retailProductsApi.uploadVariantImage(variantId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retail-products'] });
    },
  });
}

export function useDeleteRetailVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variantId: number) => retailProductsApi.deleteVariant(variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retail-products'] });
    },
  });
}
