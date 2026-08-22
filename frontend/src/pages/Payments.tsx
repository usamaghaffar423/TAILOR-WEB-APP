import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '@/api/payments';
import { StitchDivider } from '@/components/ui/StitchDivider';
import { EmptyState } from '@/components/ui/EmptyState';
import { KpiCard } from '@/components/ui/KpiCard';
import { Button } from '@/components/ui/Button';
import { AddPaymentModal } from '@/components/payments/AddPaymentModal';
import { formatCurrency, formatDateShort } from '@/lib/format';
import type { PaymentMethod } from '@/types';

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Cash',
  easypaisa: 'Easypaisa',
  jazzcash: 'JazzCash',
  bank: 'Bank',
};

export default function Payments() {
  const [tab, setTab] = useState<'balances' | 'history'>('balances');
  const [addOpen, setAddOpen] = useState(false);
  const [presetOrderId, setPresetOrderId] = useState<number | undefined>(undefined);
  const [q, setQ] = useState('');
  const [method, setMethod] = useState<PaymentMethod | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data: summaryRes } = useQuery({ queryKey: ['payments', 'summary'], queryFn: () => paymentsApi.summary() });
  const { data: balancesRes, refetch: refetchBalances } = useQuery({ queryKey: ['payments', 'balances'], queryFn: () => paymentsApi.balances() });
  const { data: historyRes, isLoading, error, refetch: refetchHistory } = useQuery({
    queryKey: ['payments', { q, method, from, to }],
    queryFn: () => paymentsApi.index({ q: q || undefined, method: method || undefined, from: from || undefined, to: to || undefined }),
  });

  const summary = summaryRes?.data;
  const balances = balancesRes?.data || [];
  const history = historyRes?.data || [];
  // The balances endpoint already filters to pending > 0 orders only.
  const pendingBalanceCount = balances.length;

  function refreshAll() {
    refetchBalances();
    refetchHistory();
  }

  return (
    <>
      <div className="hero-row">
        <div>
          <div className="hero-eyebrow">Order Studio</div>
          <div className="hero-title display">PAYMENTS</div>
        </div>
        <div className="hero-actions">
          <Button onClick={() => { setPresetOrderId(undefined); setAddOpen(true); }}>+ Add Payment</Button>
        </div>
      </div>
      <StitchDivider />

      {summary && (
        <div className="kpi-grid">
          <KpiCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>}
            label="This Week"
            value={formatCurrency(summary.thisWeek)}
          />
          <KpiCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x={3} y={5} width={18} height={16} rx={2} /><path d="M8 3v4M16 3v4M3 10h18" /></svg>}
            label="This Month"
            value={formatCurrency(summary.thisMonth)}
          />
          <KpiCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx={12} cy={12} r={9} /><path d="M12 7v5l3 3" /></svg>}
            label="All Time"
            value={formatCurrency(summary.allTime)}
          />
          <KpiCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M4 4l7 7M20 4l-7 7M12 11v9M8 20h8" /></svg>}
            label="Total Pending"
            value={formatCurrency(summary.totalPending)}
            sub={`across ${pendingBalanceCount} order${pendingBalanceCount === 1 ? '' : 's'}`}
          />
        </div>
      )}

      <div className="filter-bar" style={{ marginTop: 8 }}>
        <div className="swatch-group" style={{ marginTop: 0 }}>
          <div className={`swatch-chip${tab === 'balances' ? ' selected' : ''}`} onClick={() => setTab('balances')}>Order Balances</div>
          <div className={`swatch-chip${tab === 'history' ? ' selected' : ''}`} onClick={() => setTab('history')}>Payment History</div>
        </div>
      </div>

      {tab === 'balances' && (
        balances.length === 0 ? (
          <EmptyState title="No orders yet" />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Order #</th><th>Customer</th><th>Total</th><th>Paid</th><th>Balance</th><th></th></tr>
              </thead>
              <tbody>
                {balances.map((b) => (
                  <tr key={b.id}>
                    <td className="cell-mono">{b.order_no}</td>
                    <td>{b.customer_name}</td>
                    <td className="cell-mono">{formatCurrency(b.total_amount)}</td>
                    <td className="cell-mono">{formatCurrency(b.paid_amount)}</td>
                    <td className={`cell-mono ${Number(b.pending_amount) > 0 ? 'balance-pending' : 'balance-paid'}`}>
                      {Number(b.pending_amount) > 0 ? formatCurrency(b.pending_amount) : 'Paid'}
                    </td>
                    <td>
                      <Button variant="outline" sm onClick={() => { setPresetOrderId(b.id); setAddOpen(true); }}>Add Payment</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'history' && (
        <>
          <div className="filter-bar">
            <input type="text" placeholder="Search order # or customer..." value={q} onChange={(e) => setQ(e.target.value)} />
            <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod | '')}>
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="easypaisa">Easypaisa</option>
              <option value="jazzcash">JazzCash</option>
              <option value="bank">Bank</option>
            </select>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>

          {isLoading && <p style={{ color: 'var(--text-faint)' }}>Loading payments…</p>}
          {error && <p style={{ color: 'var(--red-bright)' }}>Failed to load payment history.</p>}

          {historyRes && (
            history.length === 0 ? (
              <EmptyState title="No payments found" subtitle="Try adjusting your search or filters." />
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Date</th><th>Customer</th><th>Order #</th><th>Amount</th><th>Method</th><th>Note</th></tr>
                  </thead>
                  <tbody>
                    {history.map((p) => (
                      <tr key={p.id}>
                        <td className="cell-mono cell-muted">{formatDateShort(p.date)}</td>
                        <td>{p.customer_name}</td>
                        <td className="cell-mono">{p.order_no}</td>
                        <td className="cell-mono">{formatCurrency(p.amount)}</td>
                        <td>{METHOD_LABEL[p.method]}</td>
                        <td className="cell-muted">{p.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </>
      )}

      <AddPaymentModal
        orderId={presetOrderId}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => {
          setAddOpen(false);
          refreshAll();
        }}
      />
    </>
  );
}
