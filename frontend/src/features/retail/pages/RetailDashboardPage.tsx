import { Link } from 'react-router-dom';
import { StitchDivider } from '@/components/ui/StitchDivider';
import { KpiCard } from '@/components/ui/KpiCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDateShort } from '@/lib/format';
import { useRetailDashboard } from '../hooks/useRetailDashboard';
import { LowStockBadge } from '../components/LowStockBadge';
import { METHOD_LABEL } from '../lib/paymentMethod';

export default function RetailDashboardPage() {
  const { data, isLoading, error } = useRetailDashboard();
  const summary = data?.data;

  return (
    <>
      <div className="hero-row">
        <div>
          <div className="hero-eyebrow">Order Studio</div>
          <div className="hero-title display">RETAIL DASHBOARD</div>
        </div>
        <div className="hero-actions">
          <Link to="/retail/pos"><Button>+ New Sale</Button></Link>
        </div>
      </div>
      <StitchDivider />

      {isLoading && <p style={{ color: 'var(--text-faint)' }}>Loading dashboard…</p>}
      {error && <p style={{ color: 'var(--red-bright)' }}>Failed to load retail dashboard.</p>}

      {summary && (
        <>
          <div className="kpi-grid">
            <KpiCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x={3} y={5} width={18} height={16} rx={2} /><path d="M8 3v4M16 3v4M3 10h18" /></svg>}
              label="Today's Sales"
              value={summary.today_sales_count}
            />
            <KpiCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>}
              label="Today's Revenue"
              value={formatCurrency(summary.today_revenue)}
            />
            <KpiCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M20 7H4a1 1 0 00-1 1v3a2 2 0 002 2h14a2 2 0 002-2V8a1 1 0 00-1-1z" /><path d="M5 13v6a1 1 0 001 1h12a1 1 0 001-1v-6" /></svg>}
              label="Total Products"
              value={summary.total_products}
            />
            <KpiCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><path d="M12 9v4M12 17h.01" /></svg>}
              label="Low Stock Items"
              value={summary.low_stock_count}
            />
          </div>

          <h3 style={{ marginTop: 28, marginBottom: 12 }}>Low Stock</h3>
          {summary.low_stock_items.length === 0 ? (
            <EmptyState title="Nothing low on stock" subtitle="All variants are above their threshold." />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Product</th><th>Size</th><th>Color</th><th>Qty</th><th></th></tr>
                </thead>
                <tbody>
                  {summary.low_stock_items.map((item) => (
                    <tr key={item.variant_id}>
                      <td>{item.product_name || '—'}</td>
                      <td>{item.size || '—'}</td>
                      <td>{item.color || '—'}</td>
                      <td className="cell-mono">{item.quantity_in_stock}</td>
                      <td><LowStockBadge qty={item.quantity_in_stock} threshold={item.threshold} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3 style={{ marginTop: 28, marginBottom: 12 }}>Recent Sales</h3>
          {summary.recent_sales.length === 0 ? (
            <EmptyState title="No sales yet" subtitle="Sales recorded at the POS will show up here." />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Date</th><th>Customer</th><th>Total</th><th>Payment</th></tr>
                </thead>
                <tbody>
                  {summary.recent_sales.map((s) => (
                    <tr key={s.id}>
                      <td className="cell-mono cell-muted">{formatDateShort(s.sale_date)}</td>
                      <td>{s.customer_name || 'Walk-in'}</td>
                      <td className="cell-mono">{formatCurrency(s.total_amount)}</td>
                      <td>{METHOD_LABEL[s.payment_method]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
