export function formatCurrency(n: number | string | undefined | null): string {
  const num = Number(n || 0);
  return 'Rs ' + num.toLocaleString('en-PK', { maximumFractionDigits: 0 });
}

export function formatDate(ts: string | number | Date | null | undefined): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateShort(ts: string | number | Date | null | undefined): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// YYYY-MM-DD in LOCAL time, for pre-filling <input type="date"> — toISOString
// would shift the date across UTC+5 (Pakistan) midnight boundaries.
export function toDateInputValue(ts: string | number | Date): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 21) return 'Good Evening';
  return 'Good Night';
}

export function daysUntil(ts: string | number | Date): number {
  const MS = 86400000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(ts);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / MS);
}

export function initials(name: string | null | undefined): string {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
