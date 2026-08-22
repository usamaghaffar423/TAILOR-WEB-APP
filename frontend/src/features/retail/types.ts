export interface RetailProduct {
  id: number;
  name: string;
  category: string | null;
  description: string | null;
  sale_price: string;
  is_active: boolean;
  variants: RetailProductVariant[];
  created_at: string;
}

export interface RetailProductVariant {
  id: number;
  retail_product_id: number;
  size: string | null;
  color: string | null;
  sku: string | null;
  image_path: string | null;
  inventory: RetailInventoryItem | null;
  product?: RetailProduct;
}

export interface RetailInventoryItem {
  id: number;
  retail_product_variant_id: number;
  quantity_in_stock: number;
  low_stock_threshold: number;
  last_restocked_at: string | null;
  is_low_stock: boolean;
  variant?: RetailProductVariant;
}

export interface RetailStockMovement {
  id: number;
  retail_product_variant_id: number;
  type: 'PURCHASE_IN' | 'SALE_OUT' | 'ADJUSTMENT' | 'RETURN';
  quantity: number;
  reference_id: number | null;
  note: string | null;
  created_at: string;
}

export type RetailPaymentMethod = 'cash' | 'card' | 'easypaisa' | 'jazzcash';

export interface RetailSale {
  id: number;
  sale_date: string;
  total_amount: string;
  payment_method: RetailPaymentMethod;
  customer_name: string | null;
  customer_phone: string | null;
  items: RetailSaleItem[];
  items_count?: number;
  created_at: string;
}

export interface RetailSaleItem {
  id: number;
  retail_sale_id: number;
  retail_product_variant_id: number;
  quantity: number;
  unit_price: string;
  subtotal: string;
  variant: RetailProductVariant & { product: RetailProduct };
}

export interface CartItem {
  variant: RetailProductVariant & { product: RetailProduct };
  quantity: number;
  unit_price: number;
}

export interface RetailDashboardSummary {
  today_sales_count: number;
  today_revenue: string;
  total_products: number;
  low_stock_count: number;
  low_stock_items: {
    variant_id: number;
    product_name: string | null;
    size: string | null;
    color: string | null;
    quantity_in_stock: number;
    threshold: number;
  }[];
  recent_sales: RetailSale[];
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}
