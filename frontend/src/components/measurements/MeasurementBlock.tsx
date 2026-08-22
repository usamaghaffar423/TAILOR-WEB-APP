import { Fragment } from 'react';
import type { MeasurementTemplate } from '@/types';

interface MeasurementBlockProps {
  template: MeasurementTemplate;
  fields: Record<string, string | string[]>;
  notes?: string | null;
}

function displayValue(val: string | string[] | undefined): string {
  if (Array.isArray(val)) {
    return val.length > 0 ? val.join(' / ') : '—';
  }
  return val || '—';
}

export function MeasurementBlock({ template, fields, notes }: MeasurementBlockProps) {
  const core = template.fields.filter((f) => !f.advanced);
  const advanced = template.fields.filter((f) => f.advanced);
  const groups = [...new Set(core.map((f) => f.group || 'Measurements'))];
  const showGroups = groups.length > 1;

  let lastGroup: string | null = null;

  return (
    <>
      <div className="oc-section-title">{template.label} — Measurements</div>
      <div className="form-grid cols-4 oc-meas-grid">
        {core.map((f) => {
          const g = f.group || 'Measurements';
          const heading = showGroups && g !== lastGroup;
          if (heading) lastGroup = g;
          return (
            <Fragment key={f.key}>
              {heading && (
                <div className={`grid-span-4 meas-group-heading${lastGroup !== groups[0] ? ' spaced' : ''}`}>
                  {g}
                </div>
              )}
              <div className="oc-meas-item">
                <span className="k">{f.label}</span>
                <span className="v mono">{displayValue(fields?.[f.key])}</span>
              </div>
            </Fragment>
          );
        })}
      </div>

      {advanced.length > 0 && (
        <details className="adv-toggle">
          <summary>Advanced Measurements</summary>
          <div className="form-grid cols-4 oc-meas-grid adv-toggle-body">
            {advanced.map((f) => (
              <div key={f.key} className="oc-meas-item">
                <span className="k">{f.label}</span>
                <span className="v mono">{displayValue(fields?.[f.key])}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {notes && (
        <div className="oc-notes">
          <b>Notes:</b> {notes}
        </div>
      )}
    </>
  );
}
