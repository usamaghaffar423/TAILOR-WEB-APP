import { Fragment, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/api/settings';
import { Button } from '@/components/ui/Button';
import type { MeasurementTemplate } from '@/types';

interface MeasurementFieldsFormProps {
  template: MeasurementTemplate;
  fields: Record<string, string | string[]>;
  onFieldChange: (key: string, value: string | string[]) => void;
}

function slugify(label: string, existingKeys: Set<string>): string {
  const base = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || `field_${Date.now()}`;
  if (!existingKeys.has(base)) return base;
  let n = 2;
  while (existingKeys.has(`${base}_${n}`)) n++;
  return `${base}_${n}`;
}

export function MeasurementFieldsForm({ template, fields, onFieldChange }: MeasurementFieldsFormProps) {
  const core = template.fields.filter((f) => !f.advanced);
  const advanced = template.fields.filter((f) => f.advanced);
  const groups = [...new Set(core.map((f) => f.group || 'Measurements'))];
  const showGroups = groups.length > 1;
  let lastGroup: string | null = null;

  const queryClient = useQueryClient();
  const [addingField, setAddingField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');

  const addFieldMutation = useMutation({
    mutationFn: async (label: string) => {
      // template.fields can be stale if this page has been open for a
      // while (React Query cache, or another tab/admin changed the
      // template since) — fetch the current server copy right before
      // writing so the save can't silently drop fields that exist on the
      // server but not in this stale snapshot.
      const fresh = await settingsApi.getTemplates();
      const baseFields = fresh.data.find((t) => t.template_key === template.template_key)?.fields ?? template.fields;
      const existingKeys = new Set(baseFields.map((f) => f.key));
      const key = slugify(label, existingKeys);
      const lastFieldGroup = baseFields[baseFields.length - 1]?.group;
      return settingsApi.updateTemplate(template.template_key, {
        label: template.label,
        fields: [...baseFields, { key, label: label.trim(), ...(lastFieldGroup ? { group: lastFieldGroup } : {}) }],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setNewFieldLabel('');
      setAddingField(false);
    },
  });

  function submitNewField(e: React.FormEvent) {
    e.preventDefault();
    const label = newFieldLabel.trim();
    if (!label) return;
    addFieldMutation.mutate(label);
  }

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

      <div className="grid-span-4" style={{ marginTop: 6 }}>
        {addingField ? (
          <form onSubmit={submitNewField} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="text"
              value={newFieldLabel}
              onChange={(e) => setNewFieldLabel(e.target.value)}
              placeholder="Field name, e.g. Cuff Width"
              autoFocus
              style={{ flex: 1, maxWidth: 260 }}
            />
            <button type="submit" className="row-icon-btn" title="Add field" disabled={!newFieldLabel.trim() || addFieldMutation.isPending}>
              {addFieldMutation.isPending ? '…' : '+'}
            </button>
            <button
              type="button"
              className="row-icon-btn"
              title="Cancel"
              onClick={() => { setAddingField(false); setNewFieldLabel(''); }}
            >
              &times;
            </button>
          </form>
        ) : (
          <Button type="button" variant="outline" sm onClick={() => setAddingField(true)}>
            + Add Field
          </Button>
        )}
      </div>
    </div>
  );
}
