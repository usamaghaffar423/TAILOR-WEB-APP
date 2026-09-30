import type { OrderStyle } from '@/types';

export interface StyleFieldDef {
  key: keyof OrderStyle;
  label: string;
  labelUrdu: string;
  // true = plain text input (no fixed option list); false/omitted = dropdown.
  freeText?: boolean;
}

// Order matches the two-column source sheet read left-to-right, top-to-
// bottom (col 1 row 1, col 2 row 1, col 1 row 2, col 2 row 2, ...) so
// rendering this list into a 2-col grid reproduces that layout exactly.
export const STYLE_FIELDS: StyleFieldDef[] = [
  { key: 'style_collar', label: 'Collar', labelUrdu: 'کالر' },
  { key: 'cuff', label: 'Cuff', labelUrdu: 'کف', freeText: true },
  { key: 'half_ban', label: 'Half Ban', labelUrdu: 'ہاف بند' },
  { key: 'salai_type', label: 'Salai Type', labelUrdu: 'سلائی کی قسم' },
  { key: 'full_ban', label: 'Full Ban', labelUrdu: 'فل بند' },
  { key: 'shalwar_design', label: 'Shalwar Design', labelUrdu: 'شلوار ڈیزائن', freeText: true },
  { key: 'front_pocket', label: 'Front Pocket', labelUrdu: 'سامنے کی جیب' },
  { key: 'dhaga', label: 'Dhaga', labelUrdu: 'دھاگہ' },
  { key: 'side_pocket', label: 'Side Pocket', labelUrdu: 'سائیڈ جیب' },
  { key: 'button', label: 'Button', labelUrdu: 'بٹن' },
  { key: 'style_daman', label: 'Daman', labelUrdu: 'دامن' },
  { key: 'sada_asteen', label: 'Sada Asteen', labelUrdu: 'سادہ آستین', freeText: true },
  { key: 'chak_pati', label: 'Chak Pati', labelUrdu: 'چاک پٹی' },
  { key: 'down_shoulder', label: 'Down Shoulder', labelUrdu: 'ڈاون شولڈر' },
  { key: 'moda', label: 'Moda', labelUrdu: 'مودا', freeText: true },
  { key: 'design', label: 'Design', labelUrdu: 'ڈیزائن' },
  { key: 'pati', label: 'Pati', labelUrdu: 'پٹی', freeText: true },
];

export const STYLE_FIELD_OPTIONS: Partial<Record<keyof OrderStyle, string[]>> = {
  style_collar: ['1.5', '1.75', '2', '2.25F', '2.25N', '2.5', '2.75', '3'],
  half_ban: ['MAGHZE', '0.5', '0.75', '1', '1.25'],
  full_ban: ['1', '1.25'],
  front_pocket: ['Yes', 'No'],
  side_pocket: ['2', '1'],
  style_daman: ['GOL', 'SADA', 'KURTA'],
  chak_pati: ['KAJ', 'NO KAJ'],
  salai_type: ['Single', 'Double Pair', 'Double Nazdak', 'Triple Salai', 'Double Tak', '4k'],
  dhaga: ['Sada', 'Chamaktar'],
  button: ['Sada', 'Ring Button', 'Steel Button'],
  down_shoulder: ['Normal Down', 'Full Down', 'Seda'],
  design: ['Yes', 'No'],
};

// Appended to every style dropdown. The Dropdown component has no way to go
// back to "Select…" once a value is picked, so choosing Delete clears the
// field: an empty value is dropped at save time (only filled fields are sent)
// and the karigar bill prints a style row only for fields that hold a value —
// so a deleted customization never reaches the bill.
export const STYLE_DELETE_OPTION = 'Delete';

/** One entry in a style dropdown. `danger` marks the red Delete action. */
export interface StyleFieldOption {
  value: string;
  label: string;
  danger?: boolean;
}

/** Options for one style dropdown — the field's own list, plus Delete last. */
export function styleFieldOptions(key: keyof OrderStyle): StyleFieldOption[] {
  return [
    ...(STYLE_FIELD_OPTIONS[key] ?? []).map((v): StyleFieldOption => ({ value: v, label: v })),
    { value: STYLE_DELETE_OPTION, label: STYLE_DELETE_OPTION, danger: true },
  ];
}

/** Maps a dropdown selection to the value to store; Delete clears the field. */
export function styleSelectionValue(selection: string): string {
  return selection === STYLE_DELETE_OPTION ? '' : selection;
}

/**
 * A style value worth showing on a bill, order card or WhatsApp text: never
 * blank and never the Delete marker, so a field left empty — or cleared with
 * Delete — stays off the printout entirely.
 */
export function printableStyleValue(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === STYLE_DELETE_OPTION) return null;
  return trimmed;
}

export interface CustomStyleField {
  label: string;
  value: string;
}

/** Returns true when the given garment template key supports style customization fields. */
export function supportsStyleCustomization(templateKey: string): boolean {
  return templateKey.startsWith('shalwar-kameez') || templateKey === 'waistcoat';
}

/** Returns true when the template is waistcoat — waistcoat uses only custom key-value fields, not the fixed STYLE_FIELDS. */
export function isWaistcoat(templateKey: string): boolean {
  return templateKey === 'waistcoat';
}

// order.style.custom_fields is a JSON-encoded CustomStyleField[] — parse
// defensively since it's free-form data, not schema-validated on the backend.
export function parseCustomStyleFields(raw: string | undefined): CustomStyleField[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((f): f is CustomStyleField => f && typeof f.label === 'string' && typeof f.value === 'string');
  } catch {
    return [];
  }
}
