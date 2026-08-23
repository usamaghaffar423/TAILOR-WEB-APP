import type { ReactNode } from 'react';
import { URDU_LABELS } from '@/lib/styleOptionsUrdu';

interface StyleOptionPickerProps {
  options: readonly string[];
  iconMap: Record<string, ReactNode>;
  value: string;
  onChange: (value: string) => void;
}

export function StyleOptionPicker({ options, iconMap, value, onChange }: StyleOptionPickerProps) {
  return (
    <div className="style-option-grid">
      {options.map((o) => (
        <div
          key={o}
          className={`style-option-card${o === value ? ' selected' : ''}`}
          tabIndex={0}
          role="button"
          aria-pressed={o === value}
          onClick={() => onChange(o)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onChange(o);
            }
          }}
        >
          {iconMap[o] || null}
          <span className="label">
            {o}
            {URDU_LABELS[o] && (
              <>
                {' / '}
                <bdi className="label-urdu">{URDU_LABELS[o]}</bdi>
              </>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
