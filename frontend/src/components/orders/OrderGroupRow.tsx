import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDateShort } from '@/lib/format';
import { EDIT_ICON } from '@/lib/garmentIcons';
import type { OrderListItem } from '@/types';

interface OrderGroupRowProps {
  customerName: string;
  customerId: number;
  orders: OrderListItem[];
  onViewCard: (id: number) => void;
  onAddPayment: (id: number) => void;
  onCustomerBill: (id: number) => void;
  onKarigarBill: (id: number) => void;
  onEdit: (id: number) => void;
}

export function OrderGroupRow({ customerName, customerId, orders, onViewCard, onAddPayment, onCustomerBill, onKarigarBill, onEdit }: OrderGroupRowProps) {
  const [expanded, setExpanded] = useState(false);

  const totalAmount = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const totalPaid = orders.reduce((sum, o) => sum + Number(o.paid_amount ?? 0), 0);
  const totalBalance = totalAmount - totalPaid;

  return (
    <>
      <tr className="order-group-row" onClick={() => setExpanded(!expanded)}>
        <td>
          <div className="group-toggle">
            <svg className={`group-chevron ${expanded ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="group-order-range">{orders[0].order_no} – {orders[orders.length - 1].order_no}</span>
          </div>
        </td>
        <td>
          <div className="group-customer">
            <Link to={`/customers/${customerId}`} className="group-customer-name" onClick={(e) => e.stopPropagation()}>
              {customerName}
            </Link>
            <span className="group-count">{orders.length} {orders.length === 1 ? 'order' : 'orders'}</span>
          </div>
        </td>
        <td className="cell-muted">{orders[0].karigar_name}{orders.length > 1 ? ' …' : ''}</td>
        <td className="cell-mono cell-muted">{orders.length} orders</td>
        <td className="cell-mono">{formatCurrency(totalAmount)}</td>
        <td className="cell-mono">{formatCurrency(totalPaid)}</td>
        <td className={`cell-mono ${totalBalance > 0 ? 'balance-pending' : 'balance-paid'}`}>
          {totalBalance > 0 ? formatCurrency(totalBalance) : 'Paid'}
        </td>
        <td></td>
        <td></td>
      </tr>
      {expanded && orders.map((o) => (
        <tr key={o.id} className="order-group-child">
          <td className="cell-mono" style={{ paddingLeft: 32 }}>{o.order_no}</td>
          <td style={{ paddingLeft: 32 }}>{o.customer_name}</td>
          <td>{o.karigar_name}</td>
          <td className="cell-mono cell-muted">{formatDateShort(o.assigned_date)}</td>
          <td className="cell-mono">{formatDateShort(o.deadline)}</td>
          <td className="cell-mono">{formatCurrency(o.total_amount)}</td>
          <td className="cell-mono">{formatCurrency(Number(o.paid_amount ?? 0))}</td>
          <td className={`cell-mono ${Math.max(0, Number(o.total_amount) - Number(o.paid_amount ?? 0)) > 0 ? 'balance-pending' : 'balance-paid'}`}>
            {Math.max(0, Number(o.total_amount) - Number(o.paid_amount ?? 0)) > 0
              ? formatCurrency(Math.max(0, Number(o.total_amount) - Number(o.paid_amount ?? 0)))
              : 'Paid'}
          </td>
          <td>{o.status}</td>
          <td>
            <div className="row-actions">
              <button className="row-icon-btn" title="Edit order" onClick={(e) => { e.stopPropagation(); onEdit(o.id); }}>{EDIT_ICON}</button>
              <button className="row-icon-btn" title="View order card" onClick={(e) => { e.stopPropagation(); onViewCard(o.id); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx={12} cy={12} r={3} />
                </svg>
              </button>
              <button className="row-icon-btn" title="Add payment" onClick={(e) => { e.stopPropagation(); onAddPayment(o.id); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </button>
              <button className="row-icon-btn" title="Customer Bill" onClick={(e) => { e.stopPropagation(); onCustomerBill(o.id); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </button>
              <button className="row-icon-btn" title="Karigar Bill" onClick={(e) => { e.stopPropagation(); onKarigarBill(o.id); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </button>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}
