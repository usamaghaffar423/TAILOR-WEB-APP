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
        </div>
      ))}
    </div>
  );
}
