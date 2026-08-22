interface EmptyStateProps {
  title?: string;
  subtitle?: string;
}

export function EmptyState({ title = 'No results found', subtitle = 'Try adjusting your search or filters.' }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <circle cx={11} cy={11} r={7} />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      <div className="t">{title}</div>
      <div className="s">{subtitle}</div>
    </div>
  );
}
