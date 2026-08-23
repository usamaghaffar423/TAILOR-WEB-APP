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
          {/* Revenue across time periods — the top-line "how's business" view */}
          <div className="kpi-grid">
            <KpiCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx={12} cy={12} r={9} /><path d="M12 7v5l3 3" /></svg>}
              label="Today"
              value={formatCurrency(summary.revenue.today.total)}
              sub={`${summary.revenue.today.count} sale${summary.revenue.today.count === 1 ? '' : 's'}`}
            />
            <KpiCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x={3} y={5} width={18} height={16} rx={2} /><path d="M8 3v4M16 3v4M3 10h18" /></svg>}
              label="This Week"
              value={formatCurrency(summary.revenue.this_week.total)}
              sub={`${summary.revenue.this_week.count} sale${summary.revenue.this_week.count === 1 ? '' : 's'}`}
            />
            <KpiCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x={3} y={5} width={18} height={16} rx={2} /><path d="M8 3v4M16 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01" /></svg>}
              label="This Month"
              value={formatCurrency(summary.revenue.this_month.total)}
              sub={`${summary.revenue.this_month.count} sale${summary.revenue.this_month.count === 1 ? '' : 's'}`}
            />
            <KpiCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>}
              label="All Time"
              value={formatCurrency(summary.revenue.all_time.total)}
              sub={`${summary.revenue.all_time.count} sale${summary.revenue.all_time.count === 1 ? '' : 's'}`}
            />
          </div>

          {/* Inventory & catalog health */}
          <div className="kpi-grid" style={{ marginTop: 14 }}>
            <KpiCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M20 7H4a1 1 0 00-1 1v3a2 2 0 002 2h14a2 2 0 002-2V8a1 1 0 00-1-1z" /><path d="M5 13v6a1 1 0 001 1h12a1 1 0 001-1v-6" /></svg>}
              label="Products"
              value={summary.total_products}
              sub={`${summary.total_variants} variant${summary.total_variants === 1 ? '' : 's'}`}
            />
            <KpiCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M21 8L12 3 3 8v8l9 5 9-5V8z" /><path d="M3 8l9 5 9-5M12 13v8" /></svg>}
              label="Inventory Value"
              value={formatCurrency(summary.inventory_value)}
              sub="stock on hand, at sale price"
            />
            <KpiCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><path d="M12 9v4M12 17h.01" /></svg>}
              label="Low Stock Items"
              value={summary.low_stock_count}
              sub={summary.low_stock_count > 0 ? 'needs restocking' : 'all good'}
            />
            <KpiCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>}
              label="Avg. Sale (This Month)"
              value={formatCurrency(
                summary.revenue.this_month.count > 0
                  ? Number(summary.revenue.this_month.total) / summary.revenue.this_month.count
                  : 0
              )}
            />
          </div>

          <div className="form-grid cols-2" style={{ marginTop: 28, gap: 24 }}>
            <div>
              <h3 style={{ marginBottom: 12 }}>Payment Methods (This Month)</h3>
              {summary.payment_breakdown.length === 0 ? (
                <EmptyState title="No sales this month" subtitle="Payment method breakdown will appear here." />
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr><th>Method</th><th>Sales</th><th>Total</th></tr>
                    </thead>
                    <tbody>
                      {summary.payment_breakdown.map((row) => (
                        <tr key={row.payment_method}>
                          <td>{METHOD_LABEL[row.payment_method]}</td>
                          <td className="cell-mono">{row.count}</td>
                          <td className="cell-mono">{formatCurrency(row.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h3 style={{ marginBottom: 12 }}>Top Products (This Month)</h3>
              {summary.top_products.length === 0 ? (
                <EmptyState title="No sales this month" subtitle="Best sellers will appear here." />
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr><th>Product</th><th>Qty Sold</th><th>Revenue</th></tr>
                    </thead>
                    <tbody>
                      {summary.top_products.map((p) => (
                        <tr key={p.product_name}>
                          <td>{p.product_name}</td>
                          <td className="cell-mono">{p.qty_sold}</td>
                          <td className="cell-mono">{formatCurrency(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
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
