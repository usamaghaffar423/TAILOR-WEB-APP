import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '@/api/dashboard';
import { StitchDivider } from '@/components/ui/StitchDivider';
import { KpiCard } from '@/components/ui/KpiCard';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { OrderCardModal } from '@/components/orders/OrderCardModal';
import { formatCurrency, formatDateShort, initials } from '@/lib/format';

export default function Dashboard() {
  const [cardOrderId, setCardOrderId] = useState<number | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.index(),
  });

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <div className="hero-row">
        <div>
          <div className="hero-eyebrow">Order Studio</div>
          <div className="hero-title display">DASHBOARD</div>
          <div className="hero-date">{today}</div>
        </div>
      </div>
      <StitchDivider />

      {isLoading && <p style={{ color: 'var(--text-faint)' }}>Loading dashboard…</p>}
      {error && <p style={{ color: 'var(--red-bright)' }}>Failed to load dashboard data.</p>}

      {data && (
        <>
          <div className="kpi-grid">
            <KpiCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M4 4l7 7M20 4l-7 7M12 11v9M8 20h8" /></svg>}
              label="Total Orders"
              value={data.data.kpis.totalOrders}
              sub={<><b>+{data.data.kpis.newThisWeek}</b> this week</>}
            />
            <KpiCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx={12} cy={12} r={9} /><path d="M12 7v5l3 3" /></svg>}
              label="In Progress"
              value={data.data.kpis.inProgress}
              sub={`across ${data.data.kpis.karigarCount} karigar${data.data.kpis.karigarCount === 1 ? '' : 's'}`}
            />
            <KpiCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x={3} y={5} width={18} height={16} rx={2} /><path d="M8 3v4M16 3v4M3 10h18" /></svg>}
              label="Due This Week"
              value={data.data.kpis.dueThisWeek}
              unit="orders"
              sub={<><b>{data.data.kpis.dueTomorrow}</b> due tomorrow</>}
            />
            <KpiCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>}
              label="Pending Payments"
              value={formatCurrency(data.data.kpis.pendingPayments.totalPending)}
              sub={`across ${data.data.kpis.pendingPayments.orderCount} order${data.data.kpis.pendingPayments.orderCount === 1 ? '' : 's'}`}
            />
          </div>

          <div className="grid-2">
            <div className="panel">
              <div className="panel-head">
                <h3>Recent Orders</h3>
                <Link to="/orders">View All →</Link>
              </div>
              {data.data.recentOrders.length === 0 ? (
                <EmptyState title="No orders yet" subtitle="Create your first order to see it here." />
              ) : (
                data.data.recentOrders.map((o) => (
                  <div key={o.id} className="order-row clickable" onClick={() => setCardOrderId(o.id)}>
                    <div className="order-avatar">{initials(o.customer_name)}</div>
                    <div className="order-info">
                      <div className="order-name">{o.customer_name}</div>
                      <div className="order-meta mono">{o.order_no}</div>
                    </div>
                    <div className="order-deadline">Deadline<b>{formatDateShort(o.deadline)}</b></div>
                    <Badge status={o.status} />
                  </div>
                ))
              )}
            </div>

            <div>
              <div className="panel">
                <div className="panel-head">
                  <h3>Karigar Workload</h3>
                  <Link to="/karigars">View All →</Link>
                </div>
                {data.data.karigarWorkload.length === 0 ? (
                  <EmptyState title="No karigars yet" />
                ) : (
                  data.data.karigarWorkload.map((k) => {
                    const pct = k.maxCapacity ? Math.min(100, Math.round((k.activeOrders / k.maxCapacity) * 100)) : 0;
                    return (
                      <div key={k.id} className="karigar-row">
                        <div className="karigar-top">
                          <span className="karigar-name">{k.name}</span>
                          <span className="karigar-count">{k.activeOrders} active</span>
                        </div>
                        <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="panel panel-spacer">
                <div className="panel-head">
                  <h3>Deadlines This Week</h3>
                </div>
                {data.data.deadlinesThisWeek.length === 0 ? (
                  <EmptyState title="No deadlines this week" />
                ) : (
                  data.data.deadlinesThisWeek.map((o) => {
                    const d = new Date(o.deadline);
                    return (
                      <div key={o.id} className="deadline-item">
                        <div className="deadline-day">
                          <span className="d display">{d.getDate()}</span>
                          <span className="m">{d.toLocaleDateString('en-GB', { month: 'short' })}</span>
                        </div>
                        <div className="deadline-info">
                          <div className="n">{o.customer_name}</div>
                          <div className="k">{o.order_no}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <OrderCardModal orderId={cardOrderId} onClose={() => setCardOrderId(null)} />
    </>
  );
}
