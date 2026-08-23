import { useRef } from 'react';
import { COLOR_OPTS } from '@/lib/styleOptions';
import { URDU_LABELS } from '@/lib/styleOptionsUrdu';

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const customInputRef = useRef<HTMLInputElement>(null);
  const isCustom = !COLOR_OPTS.some((c) => c.hex.toLowerCase() === value.toLowerCase());

  return (
    <div className="color-dot-group">
      {COLOR_OPTS.map((c) => {
        const label = URDU_LABELS[c.name] ? `${c.name} / ${URDU_LABELS[c.name]}` : c.name;
        return (
          <div
            key={c.hex}
            className={`color-dot${c.hex === value ? ' selected' : ''}`}
            style={{ background: c.hex }}
            title={label}
            aria-label={label}
            onClick={() => onChange(c.hex)}
          />
        );
      })}
      <div
        className={`color-dot${isCustom ? ' selected' : ''}`}
        title="Custom Color / حسب منشا رنگ"
        aria-label="Custom Color / حسب منشا رنگ"
        style={{
          background: isCustom ? value : 'var(--surface)',
          border: '1.5px dashed var(--border-strong)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 15,
          color: 'var(--text-faint)',
        }}
        onClick={() => customInputRef.current?.click()}
      >
        {isCustom ? '' : '+'}
      </div>
      <input
        ref={customInputRef}
        type="color"
        value={isCustom ? value : '#000000'}
        onChange={(e) => onChange(e.target.value)}
        style={{ display: 'none' }}
      />
    </div>
  );
}
