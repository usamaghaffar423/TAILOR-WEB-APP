import { useNavigate } from 'react-router-dom';
import { initials, formatDateShort } from '@/lib/format';
import type { Customer } from '@/types';

interface CustomerCardProps {
  customer: Customer;
  totalOrders?: number;
  lastOrderDate?: string | null;
}

export function CustomerCard({ customer, totalOrders, lastOrderDate }: CustomerCardProps) {
  const navigate = useNavigate();
  return (
    <div className="entity-card" onClick={() => navigate(`/customers/${customer.id}`)}>
      <div className="entity-card-top">
        <div className="entity-card-avatar">{initials(customer.name)}</div>
        <div>
          <div className="entity-card-name">{customer.name}</div>
          <div className="entity-card-sub">{customer.customer_id} · {customer.phone}</div>
        </div>
      </div>
      <div className="entity-card-stats">
        <div className="entity-stat">
          <div className="v">{totalOrders ?? '—'}</div>
          <div className="l">Orders</div>
        </div>
        <div className="entity-stat">
          <div className="v">{lastOrderDate ? formatDateShort(lastOrderDate) : '—'}</div>
          <div className="l">Last Order</div>
        </div>
      </div>
    </div>
  );
}
