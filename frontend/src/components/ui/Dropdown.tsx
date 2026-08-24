import { useEffect, useRef, useState } from 'react';

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}

// Brand-styled replacement for a native <select> — Chrome/Edge on Windows
// render a native select's open option list using the OS accent color
// (blue), which CSS cannot override. Building the popup ourselves keeps it
// on-brand (dark surface, red accents) in every browser/OS.
export function Dropdown({ value, onChange, options, placeholder = 'Select…' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="dropdown" ref={rootRef}>
      <button type="button" className={`dropdown-trigger${open ? ' open' : ''}`} onClick={() => setOpen((o) => !o)}>
        <span className={value ? undefined : 'placeholder'}>{value || placeholder}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="dropdown-menu" role="listbox">
          {options.map((o) => (
            <div
              key={o}
              role="option"
              aria-selected={o === value}
              className={`dropdown-option${o === value ? ' selected' : ''}`}
              onClick={() => { onChange(o); setOpen(false); }}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
