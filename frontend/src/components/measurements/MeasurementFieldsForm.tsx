import { Fragment } from 'react';
import type { MeasurementTemplate } from '@/types';

interface MeasurementFieldsFormProps {
  template: MeasurementTemplate;
  fields: Record<string, string>;
  onFieldChange: (key: string, value: string) => void;
}

export function MeasurementFieldsForm({ template, fields, onFieldChange }: MeasurementFieldsFormProps) {
  const core = template.fields.filter((f) => !f.advanced);
  const advanced = template.fields.filter((f) => f.advanced);
  const groups = [...new Set(core.map((f) => f.group || 'Measurements'))];
  const showGroups = groups.length > 1;
  let lastGroup: string | null = null;

  function fieldInput(key: string, label: string) {
    return (
      <div className="field">
        <label>{label}</label>
        <input
          type="text"
          className="mono"
          value={fields[key] || ''}
          placeholder="in inches"
          onChange={(e) => onFieldChange(key, e.target.value)}
        />
      </div>
    );
  }

  return (
    <div className="form-grid cols-4">
      {core.map((f) => {
        const g = f.group || 'Measurements';
        const heading = showGroups && g !== lastGroup;
        if (heading) lastGroup = g;
        return (
          <Fragment key={f.key}>
            {heading && (
              <div className={`grid-span-4 meas-group-heading${lastGroup !== groups[0] ? ' spaced' : ''}`}>
                {g} Measurements
              </div>
            )}
            {fieldInput(f.key, f.label)}
          </Fragment>
        );
      })}

      {advanced.length > 0 && (
        <div className="grid-span-4">
          <details className="adv-toggle">
            <summary>Advanced Measurements</summary>
            <div className="form-grid cols-4 adv-toggle-body">
              {advanced.map((f) => (
                <Fragment key={f.key}>{fieldInput(f.key, f.label)}</Fragment>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
