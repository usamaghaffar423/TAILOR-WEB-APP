import { useNavigate } from 'react-router-dom';
import { initials, formatDateShort, formatCurrency } from '@/lib/format';
import type { Customer } from '@/types';

interface CustomerCardProps {
  customer: Customer;
  totalOrders?: number;
  lastOrderDate?: string | null;
}

export function CustomerCard({ customer, totalOrders, lastOrderDate }: CustomerCardProps) {
  const navigate = useNavigate();
  // Server-computed account total (total_spent - total_paid across ALL the
  // customer's orders) — kept in sync with payments/order changes by the
  // API's cache busting, so the badge is the live outstanding debt.
  const unpaid = Number(customer.total_unpaid_balance ?? 0);
  return (
    <div className="entity-card" onClick={() => navigate(`/customers/${customer.id}`)}>
      <div className="entity-card-top">
        <div className="entity-card-avatar">{initials(customer.name)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="entity-card-name">{customer.name}</div>
          <div className="entity-card-sub">{customer.customer_id} · {customer.phone}</div>
        </div>
        {unpaid > 0 ? (
          <span className="badge badge-progress" title="Total Outstanding Balance">{formatCurrency(unpaid)} due</span>
        ) : (
          <span className="badge badge-ready" title="Total Outstanding Balance">Settled</span>
        )}
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
        <div className="entity-stat">
          <div className={`v ${unpaid > 0 ? 'balance-pending' : 'balance-paid'}`}>{formatCurrency(unpaid)}</div>
          <div className="l">Outstanding</div>
        </div>
      </div>
    </div>
  );
}
