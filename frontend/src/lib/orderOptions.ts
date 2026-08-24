import type { DropdownOption } from '@/components/ui/Dropdown';

export const ORDER_STATUS_OPTIONS: DropdownOption[] = [
  { value: 'progress', label: 'In Progress' },
  { value: 'ready', label: 'Ready' },
  { value: 'delivered', label: 'Delivered' },
];

export const PAYMENT_METHOD_OPTIONS: DropdownOption[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'easypaisa', label: 'Easypaisa' },
  { value: 'jazzcash', label: 'JazzCash' },
  { value: 'bank', label: 'Bank' },
];
