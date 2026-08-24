import { useRef } from 'react';

interface DateInputProps {
  value: string; // yyyy-mm-dd (native <input type="date"> format), or ''
  onChange: (value: string) => void;
}

function toDisplay(iso: string): string {
  const parts = iso.split('-');
  if (parts.length !== 3) return '';
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

// Native <input type="date"> displays according to the browser/OS locale —
// there's no HTML/CSS way to force dd/mm/yyyy. This wraps a real date input
// (kept for its calendar picker) with a visible dd/mm/yyyy label on top, so
// the picker still works but the displayed text is always dd/mm/yyyy.
export function DateInput({ value, onChange }: DateInputProps) {
  const nativeRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    const el = nativeRef.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') {
      el.showPicker();
    } else {
      el.focus();
    }
  }

  return (
    <div className="date-input" onClick={openPicker}>
      <span className={value ? undefined : 'placeholder'}>{value ? toDisplay(value) : 'dd/mm/yyyy'}</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x={3} y={5} width={18} height={16} rx={2} />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </svg>
      <input
        ref={nativeRef}
        type="date"
        className="date-input-native"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
