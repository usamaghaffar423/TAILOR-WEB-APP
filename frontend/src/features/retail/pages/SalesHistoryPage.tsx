import { Fragment, useState } from 'react';
import { StitchDivider } from '@/components/ui/StitchDivider';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatDate, toDateInputValue } from '@/lib/format';
import { useRetailSale, useRetailSales } from '../hooks/useRetailSales';
import { useRetailProducts } from '../hooks/useRetailProducts';
import { METHOD_LABEL, METHOD_OPTIONS } from '../lib/paymentMethod';
import type { RetailPaymentMethod, RetailSale } from '../types';

type Preset = 'all' | 'today' | 'week' | 'month' | 'custom';

function presetRange(preset: Preset): { from: string; to: string } {
  const today = new Date();
  const to = toDateInputValue(today);

  if (preset === 'today') return { from: to, to };

  if (preset === 'week') {
    const day = today.getDay(); // 0 = Sunday
    const diffToMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - diffToMonday);
    return { from: toDateInputValue(monday), to };
  }

  if (preset === 'month') {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: toDateInputValue(first), to };
  }

  return { from: '', to: '' };
}

function SaleRow({ sale, expanded, onToggle }: { sale: RetailSale; expanded: boolean; onToggle: () => void }) {
  const { data: detailRes } = useRetailSale(expanded ? sale.id : null);
  const items = detailRes?.data.items || [];

  return (
    <Fragment>
      <tr style={{ cursor: 'pointer' }} onClick={onToggle}>
        <td className="cell-mono">#{sale.id}</td>
        <td className="cell-mono cell-muted">{formatDate(sale.sale_date)}</td>
        <td>{sale.customer_name || 'Walk-in'}</td>
        <td className="cell-mono">{sale.items_count ?? '—'}</td>
        <td className="cell-mono">{formatCurrency(sale.total_amount)}</td>
        <td>{METHOD_LABEL[sale.payment_method]}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} style={{ background: 'var(--surface-2)', padding: '10px 16px' }}>
            {items.length === 0 ? (
              <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>Loading…</span>
            ) : (
              items.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '3px 0' }}>
                  <span>
                    {item.variant.product.name}
                    {(item.variant.size || item.variant.color) && (
                      <span className="cell-muted"> ({[item.variant.size, item.variant.color].filter(Boolean).join(' / ')})</span>
                    )}
                    {' '}× {item.quantity}
                  </span>
                  <span className="cell-mono">{formatCurrency(item.subtotal)}</span>
                </div>
              ))
            )}
          </td>
        </tr>
      )}
    </Fragment>
  );
}

export default function SalesHistoryPage() {
  const [preset, setPreset] = useState<Preset>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [method, setMethod] = useState<RetailPaymentMethod | ''>('');
  const [productId, setProductId] = useState<number | ''>('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const { data: productsRes } = useRetailProducts();
  const products = productsRes?.data || [];

  function applyPreset(p: Preset) {
    setPreset(p);
    const { from, to } = presetRange(p);
    setDateFrom(from);
    setDateTo(to);
    setPage(1);
  }

  const { data, isLoading, error } = useRetailSales({
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    payment_method: method || undefined,
    product_id: productId || undefined,
    page,
  });

  const sales = data?.data || [];

  const totalForFilter = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);

  return (
    <>
      <div className="hero-row">
        <div>
          <div className="hero-eyebrow">Order Studio</div>
          <div className="hero-title display">SALES HISTORY</div>
        </div>
      </div>
      <StitchDivider />

      <div className="swatch-group" style={{ marginTop: 0, marginBottom: 12 }}>
        <div className={`swatch-chip${preset === 'all' ? ' selected' : ''}`} onClick={() => applyPreset('all')}>All Time</div>
        <div className={`swatch-chip${preset === 'today' ? ' selected' : ''}`} onClick={() => applyPreset('today')}>Today</div>
        <div className={`swatch-chip${preset === 'week' ? ' selected' : ''}`} onClick={() => applyPreset('week')}>This Week</div>
        <div className={`swatch-chip${preset === 'month' ? ' selected' : ''}`} onClick={() => applyPreset('month')}>This Month</div>
      </div>

      <div className="filter-bar">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPreset('custom'); setPage(1); }}
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPreset('custom'); setPage(1); }}
        />
        <select value={method} onChange={(e) => { setMethod(e.target.value as RetailPaymentMethod | ''); setPage(1); }}>
          <option value="">All Methods</option>
          {METHOD_OPTIONS.map((m) => (
            <option key={m} value={m}>{METHOD_LABEL[m]}</option>
          ))}
        </select>
        <select value={productId} onChange={(e) => { setProductId(e.target.value ? Number(e.target.value) : ''); setPage(1); }}>
          <option value="">All Products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {isLoading && <p style={{ color: 'var(--text-faint)' }}>Loading sales…</p>}
      {error && <p style={{ color: 'var(--red-bright)' }}>Failed to load sales history.</p>}

      {data && (
        sales.length === 0 ? (
          <EmptyState title="No sales found" subtitle="Try adjusting your filters." />
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, fontSize: 12.5, color: 'var(--text-faint)' }}>
              <span>{data.total} sale{data.total === 1 ? '' : 's'} matching filters</span>
              <span>Page total: <b style={{ color: 'var(--text)' }}>{formatCurrency(totalForFilter)}</b></span>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Sale #</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th></tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <SaleRow
                      key={s.id}
                      sale={s}
                      expanded={expandedId === s.id}
                      onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {data.last_page > 1 && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <span style={{ fontSize: 13, alignSelf: 'center', color: 'var(--text-faint)' }}>
                  Page {data.current_page} of {data.last_page}
                </span>
                <button className="btn btn-outline btn-sm" disabled={page >= data.last_page} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            )}
          </>
        )
      )}
    </>
  );
}
