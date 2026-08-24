import type { OrderStyle } from '@/types';

export interface StyleFieldDef {
  key: keyof OrderStyle;
  label: string;
  labelUrdu: string;
}

// Order matches the two-column source sheet read left-to-right, top-to-
// bottom (col 1 row 1, col 2 row 1, col 1 row 2, col 2 row 2, ...) so
// rendering this list into a 2-col grid reproduces that layout exactly.
export const STYLE_FIELDS: StyleFieldDef[] = [
  { key: 'style_collar', label: 'Collar', labelUrdu: 'کالر' },
  { key: 'cuff', label: 'Cuff', labelUrdu: 'کف' },
  { key: 'half_ban', label: 'Half Ban', labelUrdu: 'ہاف بند' },
  { key: 'salai_type', label: 'Salai Type', labelUrdu: 'سلائی کی قسم' },
  { key: 'full_ban', label: 'Full Ban', labelUrdu: 'فل بند' },
  { key: 'shalwar_design', label: 'Shalwar Design', labelUrdu: 'شلوار ڈیزائن' },
  { key: 'front_pocket', label: 'Front Pocket', labelUrdu: 'سامنے کی جیب' },
  { key: 'dhaga', label: 'Dhaga', labelUrdu: 'دھاگہ' },
  { key: 'side_pocket', label: 'Side Pocket', labelUrdu: 'سائیڈ جیب' },
  { key: 'button', label: 'Button', labelUrdu: 'بٹن' },
  { key: 'style_daman', label: 'Daman', labelUrdu: 'دامن' },
  { key: 'sada_asteen', label: 'Sada Asteen', labelUrdu: 'سادہ آستین' },
  { key: 'chak_pati', label: 'Chak Pati', labelUrdu: 'چاک پٹی' },
  { key: 'down_shoulder', label: 'Down Shoulder', labelUrdu: 'ڈاون شولڈر' },
  { key: 'moda', label: 'Moda', labelUrdu: 'مودا' },
  { key: 'design', label: 'Design', labelUrdu: 'ڈیزائن' },
  { key: 'pati', label: 'Pati', labelUrdu: 'پٹی' },
  { key: 'note', label: 'Note', labelUrdu: 'نوٹ' },
];

// Each dropdown's option list, to be filled in once the shop owner provides
// them. Until a field has options here, its <select> only shows the
// "Select…" placeholder.
export const STYLE_FIELD_OPTIONS: Partial<Record<keyof OrderStyle, string[]>> = {};
