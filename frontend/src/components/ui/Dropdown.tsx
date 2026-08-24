import { useEffect, useRef, useState } from 'react';

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[] | string[];
  placeholder?: string;
  disabled?: boolean;
  /** Extra class(es) on the outer wrapper — layout context, e.g. "dropdown-filter" or "dropdown-pill". */
  className?: string;
  /** Extra class(es) on the trigger button itself — for value-driven styling, e.g. a status color. */
  triggerClassName?: string;
}

// Brand-styled replacement for a native <select> — Chrome/Edge on Windows
// render a native select's open option list using the OS accent color
// (blue), which CSS cannot override. Building the popup ourselves keeps it
// on-brand (dark surface, red accents) in every browser/OS.
export function Dropdown({ value, onChange, options, placeholder = 'Select…', disabled, className, triggerClassName }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const normalized: DropdownOption[] = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const selected = normalized.find((o) => o.value === value);

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
    <div className={`dropdown${className ? ` ${className}` : ''}`} ref={rootRef}>
      <button
        type="button"
        className={`dropdown-trigger${open ? ' open' : ''}${triggerClassName ? ` ${triggerClassName}` : ''}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
      >
        <span className={selected ? undefined : 'placeholder'}>{selected ? selected.label : placeholder}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="dropdown-menu" role="listbox">
          {normalized.map((o) => (
            <div
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={`dropdown-option${o.value === value ? ' selected' : ''}`}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
