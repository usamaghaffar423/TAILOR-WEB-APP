import { useRef } from 'react';
import { COLOR_OPTS } from '@/lib/styleOptions';

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const customInputRef = useRef<HTMLInputElement>(null);
  const isCustom = !COLOR_OPTS.some((c) => c.hex.toLowerCase() === value.toLowerCase());

  return (
    <div className="color-dot-group">
      {COLOR_OPTS.map((c) => (
        <div
          key={c.hex}
          className={`color-dot${c.hex === value ? ' selected' : ''}`}
          style={{ background: c.hex }}
          title={c.name}
          aria-label={c.name}
          onClick={() => onChange(c.hex)}
        />
      ))}
      <div
        className={`color-dot${isCustom ? ' selected' : ''}`}
        title="Custom color"
        aria-label="Custom color"
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
