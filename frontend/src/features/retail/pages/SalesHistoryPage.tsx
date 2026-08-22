import { Fragment, useState } from 'react';
import { StitchDivider } from '@/components/ui/StitchDivider';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatDate } from '@/lib/format';
import { useRetailSale, useRetailSales } from '../hooks/useRetailSales';
import { METHOD_LABEL, METHOD_OPTIONS } from '../lib/paymentMethod';
import type { RetailPaymentMethod, RetailSale } from '../types';

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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [method, setMethod] = useState<RetailPaymentMethod | ''>('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useRetailSales({
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    payment_method: method || undefined,
    page,
  });

  const sales = data?.data || [];

  return (
    <>
      <div className="hero-row">
        <div>
          <div className="hero-eyebrow">Order Studio</div>
          <div className="hero-title display">SALES HISTORY</div>
        </div>
      </div>
      <StitchDivider />

      <div className="filter-bar">
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
        <select value={method} onChange={(e) => { setMethod(e.target.value as RetailPaymentMethod | ''); setPage(1); }}>
          <option value="">All Methods</option>
          {METHOD_OPTIONS.map((m) => (
            <option key={m} value={m}>{METHOD_LABEL[m]}</option>
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
