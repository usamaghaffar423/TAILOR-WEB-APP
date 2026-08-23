import { URDU_LABELS } from '@/lib/styleOptionsUrdu';

interface StyleChipPickerProps {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}

export function StyleChipPicker({ options, value, onChange }: StyleChipPickerProps) {
  return (
    <div className="swatch-group">
      {options.map((o) => (
        <div
          key={o}
          className={`swatch-chip${o === value ? ' selected' : ''}`}
          onClick={() => onChange(o)}
        >
          {o}
          {URDU_LABELS[o] && (
            <>
              {' / '}
              <bdi className="label-urdu">{URDU_LABELS[o]}</bdi>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
