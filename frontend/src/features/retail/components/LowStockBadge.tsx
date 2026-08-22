interface LowStockBadgeProps {
  qty: number;
  threshold: number;
}

export function LowStockBadge({ qty, threshold }: LowStockBadgeProps) {
  if (qty > threshold) return null;

  return (
    <span
      style={{
        display: 'inline-block',
        background: 'var(--red-pale)',
        border: '1px solid var(--red)',
        color: 'var(--red-bright)',
        borderRadius: 999,
        padding: '2px 10px',
        fontSize: 11.5,
        fontWeight: 700,
      }}
    >
      {qty === 0 ? 'Out of stock' : 'Low stock'}
    </span>
  );
}
