import type { ReactNode } from 'react';

interface KpiCardProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  unit?: string;
  sub?: ReactNode;
}

export function KpiCard({ icon, label, value, unit, sub }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <div className="kpi-tag">{icon}</div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-num display">
        {value}
        {unit ? <span className="unit">{unit}</span> : null}
      </div>
      {sub ? <div className="kpi-sub">{sub}</div> : null}
    </div>
  );
}
