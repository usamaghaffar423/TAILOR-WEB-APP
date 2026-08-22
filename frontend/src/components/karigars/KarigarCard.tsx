import { useNavigate } from 'react-router-dom';
import { initials } from '@/lib/format';
import type { Karigar } from '@/types';

export function KarigarCard({ karigar }: { karigar: Karigar }) {
  const navigate = useNavigate();
  const active = karigar.active_orders_count ?? 0;
  const pct = karigar.max_capacity ? Math.min(100, Math.round((active / karigar.max_capacity) * 100)) : 0;

  return (
    <div className="entity-card" onClick={() => navigate(`/karigars/${karigar.id}`)}>
      <div className="entity-card-top">
        <div className="entity-card-avatar">{initials(karigar.name)}</div>
        <div>
          <div className="entity-card-name">{karigar.name}</div>
          <div className="entity-card-sub">{karigar.speciality || '—'} · {karigar.phone || '—'}</div>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 6 }}>
          <span>{active} / {karigar.max_capacity || '—'} active</span>
        </div>
        <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
      </div>
    </div>
  );
}
