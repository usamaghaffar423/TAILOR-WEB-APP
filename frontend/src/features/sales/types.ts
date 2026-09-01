import type { Customer, Karigar, Payment, OrderStyle, MeasurementSnapshot } from '@/types';
import type { RetailProduct, RetailProductVariant } from '@/features/retail/types';

export type SaleStatus = 'in_progress' | 'ready' | 'delivered' | 'completed';
export type SaleItemStatus = 'n_a' | 'progress' | 'ready' | 'delivered';

export interface SaleItem {
  id: number;
  sale_id: number;
  retail_product_variant_id: number | null;
  variant: (RetailProductVariant & { product: RetailProduct }) | null;
  label: string;
  recipient_name: string | null;
  qty: number;
  unit_price: string;
  line_total: string;
  needs_stitching: boolean;
  measurement_template_key: string | null;
  measurement_snapshot: MeasurementSnapshot | null;
  style: OrderStyle | null;
  karigar_id: number | null;
  karigar: Karigar | null;
  deadline: string | null;
  item_status: SaleItemStatus;
  delivered_date: string | null;
  created_at: string;
}

export interface Sale {
  id: number;
  sale_no: string | null;
  legacy_order_id: number | null;
  legacy_retail_sale_id: number | null;
  customer_id: number | null;
  customer: Customer | null;
  subtotal: string;
  discount: string;
  total: string;
  status: SaleStatus;
  items: SaleItem[];
  payments: Payment[];
  created_at: string;
  updated_at: string;
}

export interface SaleListItem {
  id: number;
  sale_no: string | null;
  legacy_order_id: number | null;
  legacy_retail_sale_id: number | null;
  status: SaleStatus;
  total: string;
  created_at: string;
  customer_id: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  paid_amount: string;
  item_count: number;
  has_stitching: boolean;
  karigar_name: string | null;
  deadline: string | null;
  display_no: string;
}
