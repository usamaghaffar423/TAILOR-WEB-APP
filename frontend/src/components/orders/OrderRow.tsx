import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ordersApi } from '@/api/orders';
import { formatDateShort, formatCurrency } from '@/lib/format';
import type { OrderListItem, OrderStatus } from '@/types';
import { PAYMENT_ICON } from '@/lib/garmentIcons';

interface OrderRowProps {
  order: OrderListItem;
  onViewCard: (id: number) => void;
  onAddPayment: (id: number) => void;
}

export function OrderRow({ order, onViewCard, onAddPayment }: OrderRowProps) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (status: OrderStatus) => ordersApi.updateStatus(order.id, status),
    onSuccess: () => {
      toast.success('Order status updated');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const paid = Number(order.paid_amount ?? 0);
  const pending = Math.max(0, Number(order.total_amount) - paid);

  return (
    <tr>
      <td className="cell-mono">{order.order_no}</td>
      <td>
        <Link to={`/customers/${order.customer_id}`} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 600 }}>
          {order.customer_name}
        </Link>
      </td>
      <td>{order.karigar_name}</td>
      <td className="cell-mono cell-muted">{formatDateShort(order.assigned_date)}</td>
      <td className="cell-mono">{formatDateShort(order.deadline)}</td>
      <td className="cell-mono">{formatCurrency(order.total_amount)}</td>
      <td className="cell-mono">{formatCurrency(paid)}</td>
      <td className={`cell-mono ${pending > 0 ? 'balance-pending' : 'balance-paid'}`}>{pending > 0 ? formatCurrency(pending) : 'Paid'}</td>
      <td>
        <select
          className={`status-select ${order.status}`}
          value={order.status}
          disabled={mutation.isPending}
          onChange={(e) => mutation.mutate(e.target.value as OrderStatus)}
        >
          <option value="progress">In Progress</option>
          <option value="ready">Ready</option>
          <option value="delivered">Delivered</option>
        </select>
      </td>
      <td>
        <div className="row-actions">
          <button className="row-icon-btn" title="View order card" onClick={() => onViewCard(order.id)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx={12} cy={12} r={3} />
            </svg>
          </button>
          <button className="row-icon-btn" title="Add payment" onClick={() => onAddPayment(order.id)}>{PAYMENT_ICON}</button>
        </div>
      </td>
    </tr>
  );
}
