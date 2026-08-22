import { Fragment } from 'react';
import type { MeasurementTemplate } from '@/types';

interface MeasurementFieldsFormProps {
  template: MeasurementTemplate;
  fields: Record<string, string | string[]>;
  onFieldChange: (key: string, value: string | string[]) => void;
}

export function MeasurementFieldsForm({ template, fields, onFieldChange }: MeasurementFieldsFormProps) {
  const core = template.fields.filter((f) => !f.advanced);
  const advanced = template.fields.filter((f) => f.advanced);
  const groups = [...new Set(core.map((f) => f.group || 'Measurements'))];
  const showGroups = groups.length > 1;
  let lastGroup: string | null = null;

  function fieldInput(key: string, label: string) {
    const raw = fields[key];
    const values = Array.isArray(raw) ? raw : [raw ?? ''];
    const list = values.length > 0 ? values : [''];

    function updateAt(idx: number, val: string) {
      const next = [...list];
      next[idx] = val;
      onFieldChange(key, next.length === 1 ? next[0] : next);
    }
    function addEntry() {
      onFieldChange(key, [...list, '']);
    }
    function removeAt(idx: number) {
      const next = list.filter((_, i) => i !== idx);
      onFieldChange(key, next.length === 1 ? next[0] : next);
    }

    return (
      <div className="field">
        <label>{label}</label>
        {list.map((val, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: idx < list.length - 1 ? 6 : 0 }}>
            <input
              type="text"
              className="mono"
              value={val}
              placeholder="in inches"
              onChange={(e) => updateAt(idx, e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="button" className="row-icon-btn" title="Add value" onClick={addEntry}>+</button>
            {idx > 0 && (
              <button type="button" className="row-icon-btn" title="Remove value" onClick={() => removeAt(idx)}>&minus;</button>
            )}
          </div>
        ))}
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
