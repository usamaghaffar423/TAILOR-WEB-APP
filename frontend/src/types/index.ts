export type OrderStatus = 'progress' | 'ready' | 'delivered';
export type PaymentMethod = 'cash' | 'easypaisa' | 'jazzcash' | 'bank';
export type ThemeDefault = 'dark' | 'light';
export type RegionalStyle = 'Pukhtoon' | 'Punjabi';

export interface Admin {
  id: number;
  email: string;
  shop_name: string;
  created_at: string;
}

export interface ShopSettings {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  logo_path: string | null;
  banner_path: string | null;
  theme_default: ThemeDefault;
  updated_at: string;
}

export interface Customer {
  id: number;
  customer_id: string; // TMT-001
  name: string;
  phone: string;
  address: string | null;
  created_at: string;
}

export interface MeasurementTemplateField {
  key: string;
  label: string;
  group?: string;
  advanced?: boolean;
}

export interface MeasurementTemplate {
  id: number;
  template_key: string;
  label: string;
  fields: MeasurementTemplateField[];
  updated_at: string;
}

export interface Measurement {
  id: number;
  customer_id: number;
  template_key: string;
  fields: Record<string, string>;
  notes: string | null;
  updated_at: string;
}

export interface Karigar {
  id: number;
  name: string;
  phone: string | null;
  speciality: string | null;
  max_capacity: number;
  created_at: string;
  active_orders_count?: number; // appended by API on list endpoints
}

export interface OrderStyle {
  regionalStyle?: RegionalStyle;
  collar?: string;
  sleeve?: string;
  cuff?: string;
  neck?: string;
  fit?: string;
  length?: string;
  placket?: string;
  pocket?: string;
  daman?: string;
  pukhtoonShalwar?: string;
  punjabiShalwar?: string;
  mori?: string;
  waistType?: string;
  fabric?: string;
  buttonStyle?: string;
  buttonCount?: string;
  color?: string;
}

export interface MeasurementSnapshot {
  template_key: string;
  template_label: string;
  fields: Record<string, string>;
  notes: string | null;
}

export interface OrderPhoto {
  id: number;
  order_id: number;
  file_path: string;
  uploaded_at: string;
}

export interface Payment {
  id: number;
  order_id: number;
  amount: string; // decimal comes as string from Laravel/MySQL
  method: PaymentMethod;
  date: string;
  note: string | null;
}

export interface Order {
  id: number;
  order_no: string; // ORD-0001
  customer_id: number;
  style: OrderStyle;
  measurement_snapshot: MeasurementSnapshot;
  karigar_id: number;
  assigned_date: string;
  deadline: string;
  status: OrderStatus;
  delivered_date: string | null;
  total_amount: string; // decimal as string
  created_at: string;
  // Eager-loaded relationships (present on show, may be absent on list)
  customer?: Customer;
  karigar?: Karigar;
  photos?: OrderPhoto[];
  payments?: Payment[];
  // Computed by API on list endpoints
  paid_amount?: string;
  pending_amount?: string;
}

// Dashboard shapes
export interface KarigarWorkloadItem {
  id: number;
  name: string;
  activeOrders: number;
  maxCapacity: number;
}

export interface DashboardKpis {
  totalOrders: number;
  newThisWeek: number;
  inProgress: number;
  karigarCount: number;
  dueThisWeek: number;
  dueTomorrow: number;
  pendingPayments: {
    totalPending: string;
    orderCount: number;
  };
}

export interface DashboardData {
  kpis: DashboardKpis;
  recentOrders: Array<{
    id: number;
    order_no: string;
    status: OrderStatus;
    deadline: string;
    total_amount: string;
    customer_name: string;
  }>;
  karigarWorkload: KarigarWorkloadItem[];
  deadlinesThisWeek: Array<{
    id: number;
    order_no: string;
    customer_name: string;
    deadline: string;
    status: OrderStatus;
  }>;
}

// Payment endpoints
export interface PaymentSummary {
  thisWeek: string;
  thisMonth: string;
  allTime: string;
  totalPending: string;
  pendingOrderCount: number;
}

export interface OrderBalance {
  order_id: number;
  order_no: string;
  customer_name: string;
  customer_phone: string;
  total_amount: string;
  paid_amount: string;
  pending_amount: string;
  deadline: string;
}

// API error shape
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status: number;
}
