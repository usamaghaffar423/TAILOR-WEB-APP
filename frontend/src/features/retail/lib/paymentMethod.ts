import type { RetailPaymentMethod } from '../types';

export const METHOD_LABEL: Record<RetailPaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  easypaisa: 'Easypaisa',
  jazzcash: 'JazzCash',
};

export const METHOD_OPTIONS: RetailPaymentMethod[] = ['cash', 'card', 'easypaisa', 'jazzcash'];
