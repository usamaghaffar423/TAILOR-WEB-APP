import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { STYLE_FIELDS, styleFieldOptions, styleSelectionValue, isWaistcoat } from '@/lib/styleFields';
import type { CustomStyleField } from '@/lib/styleFields';

interface StyleCustomizationFieldsProps {
  templateKey: string;
  styleValues: Record<string, string>;
  onStyleChange: (key: string, value: string) => void;
  customFields: CustomStyleField[];
  onCustomFieldsChange: (fields: CustomStyleField[]) => void;
}

/**
 * Style inputs for one order — Shalwar Qameez gets the fixed STYLE_FIELDS plus
 * per-order custom fields; Waistcoat gets only the custom key-value fields.
 * Callers decide whether to render this at all (supportsStyleCustomization).
 */
export function StyleCustomizationFields({ templateKey, styleValues, onStyleChange, customFields, onCustomFieldsChange }: StyleCustomizationFieldsProps) {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const waistcoat = isWaistcoat(templateKey);

  function addCustomField() {
    const label = newLabel.trim();
    if (!label) return;
    onCustomFieldsChange([...customFields, { label, value: '' }]);
    setNewLabel('');
    setAdding(false);
  }

  return (
    <>
      {!waistcoat && (
        <div className="form-grid cols-2" style={{ marginTop: 16 }}>
          {STYLE_FIELDS.map((f) => (
            <div className={`field${f.freeText ? ' freetext' : ''}`} key={f.key}>
              <div className={f.freeText ? 'style-label-row' : undefined}>
                <label>{f.label}</label>
                {f.freeText && (
                  <button type="button" className="style-delete-btn" onClick={() => onStyleChange(f.key, '')}>Delete</button>
                )}
              </div>
              {f.freeText ? (
                <input type="text" value={styleValues[f.key] || ''} onChange={(e) => onStyleChange(f.key, e.target.value)} />
              ) : (
                <Dropdown
                  value={styleValues[f.key] || ''}
                  onChange={(v) => onStyleChange(f.key, styleSelectionValue(v))}
                  options={styleFieldOptions(f.key)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {customFields.length > 0 && (
        <div className="form-grid cols-2" style={{ marginTop: waistcoat ? 16 : 14 }}>
          {customFields.map((cf, idx) => (
            <div className="field freetext" key={idx}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{cf.label}</span>
                <button type="button" className="row-icon-btn" title="Remove field" onClick={() => onCustomFieldsChange(customFields.filter((_, i) => i !== idx))}>&minus;</button>
              </label>
              <input
                type="text"
                value={cf.value}
                onChange={(e) => onCustomFieldsChange(customFields.map((f, i) => (i === idx ? { ...f, value: e.target.value } : f)))}
              />
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        {adding ? (
          <form onSubmit={(e) => { e.preventDefault(); addCustomField(); }} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder={waistcoat ? 'Field name, e.g. Length, Buttons' : 'Field name, e.g. Special Request'}
              autoFocus
              style={{ flex: 1, maxWidth: 260 }}
            />
            <button type="submit" className="row-icon-btn" title="Add field" disabled={!newLabel.trim()}>+</button>
            <button type="button" className="row-icon-btn" title="Cancel" onClick={() => { setAdding(false); setNewLabel(''); }}>&times;</button>
          </form>
        ) : (
          <Button type="button" variant="outline" sm onClick={() => setAdding(true)}>+ Add Custom Field</Button>
        )}
      </div>
    </>
  );
}
