import type { OrderStatus } from '@/types';

const STATUS_LABEL: Record<OrderStatus, string> = {
  progress: 'In Progress',
  ready: 'Ready',
  delivered: 'Delivered',
};
const STATUS_BADGE: Record<OrderStatus, string> = {
  progress: 'badge-progress',
  ready: 'badge-ready',
  delivered: 'badge-delivered',
};

export function Badge({ status }: { status: OrderStatus }) {
  return <span className={`badge ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>;
}

export { STATUS_LABEL, STATUS_BADGE };
