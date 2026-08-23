// Urdu translations for every option value in styleOptions.ts / garmentIcons.tsx.
// Keyed by the exact English option string (the value actually stored on the
// order) — display only, never used as a stored value, so existing orders,
// bills, and WhatsApp text summaries are unaffected.
export const URDU_LABELS: Record<string, string> = {
  // SLEEVE_OPTS
  'Straight': 'سیدھی',
  'Regular': 'عام',
  'Slightly Tapered': 'ہلکی تنگ',
  'Wide Traditional': 'روایتی چوڑی',

  // CUFF_OPTS
  'Simple': 'سادہ',
  'Single Button': 'ایک بٹن',
  'Double Button': 'دو بٹن',
  'Designer Cuff': 'ڈیزائنر کف',

  // COLLAR_OPTS
  'Classic Band Collar': 'کلاسک بینڈ کالر',
  'Simple Collar': 'سادہ کالر',
  'Chinese Collar': 'چائنیز کالر',
  'Open Collar': 'کھلا کالر',
  'No Collar': 'بغیر کالر',

  // NECK_OPTS
  'Round': 'گول',
  'V-Neck': 'وی نیک',
  'Straight Opening': 'سیدھا کھلاؤ',
  'Traditional Opening': 'روایتی کھلاؤ',

  // LENGTH_OPTS
  'Short': 'چھوٹی',
  'Standard': 'عام',
  'Long': 'لمبی',
  'Extra Long': 'زیادہ لمبی',

  // FIT_OPTS
  'Traditional Loose': 'روایتی ڈھیلی',
  'Comfort Fit': 'آرام دہ فٹنگ',
  'Semi-Slim': 'نیم چست',
  'Slim': 'چست',

  // PLACKET_OPTS
  'Plain': 'سادہ',
  'Simple Button Placket': 'سادہ بٹن پٹی',
  'Traditional Patti': 'روایتی پٹی',
  'Embroidered Patti': 'کڑھائی والی پٹی',
  'Designer Front': 'ڈیزائنر فرنٹ',
  'Custom': 'حسب منشا',

  // POCKET_OPTS / POCKET_SHALWAR_OPTS
  'No Pocket': 'بغیر جیب',
  '1 Chest Pocket': 'ایک سینے کی جیب',
  '2 Chest Pockets': 'دو سینے کی جیبیں',
  '2 Side Pockets': 'دو سائیڈ جیبیں',
  '1 Chest + 2 Side': 'ایک سینے + دو سائیڈ',
  '1 Side Pocket': 'ایک سائیڈ جیب',
  'Deep Pockets': 'گہری جیبیں',

  // DAMAN_OPTS
  'Straight Hem': 'سیدھا دامن',
  'Round Hem': 'گول دامن',
  'Side Slits (Chaak)': 'سائیڈ چاک',

  // REGIONAL_OPTS
  'Pukhtoon': 'پختون',
  'Punjabi': 'پنجابی',

  // PUKHTOON_SHALWAR_OPTS
  'Traditional Wide': 'روایتی چوڑی',
  'Extra Wide Pukhtoon': 'زیادہ چوڑی پختون',
  'Medium Width': 'درمیانی چوڑائی',
  'Modern Pukhtoon': 'جدید پختون',

  // PUNJABI_SHALWAR_OPTS
  'Classic Punjabi': 'کلاسک پنجابی',
  'Straight Punjabi': 'سیدھی پنجابی',
  'Moderate Width': 'معتدل چوڑائی',
  'Narrow / Modern': 'تنگ / جدید',

  // MORI_OPTS
  'Very Wide': 'بہت چوڑی',
  'Wide': 'چوڑی',
  'Medium': 'درمیانی',
  'Narrow': 'تنگ',

  // WAIST_TYPE_OPTS
  'Elastic': 'الاسٹک',
  'Nada / Drawstring': 'ناڑا',
  'Button + Nada': 'بٹن + ناڑا',
  'Traditional Waist': 'روایتی کمر',

  // FABRIC_OPTS
  'Wash & Wear': 'واش اینڈ ویئر',
  'Cotton': 'کاٹن',
  'Khaddar': 'کھدر',
  'Linen': 'لینن',
  'Blended': 'ملواں',
  'Karandi': 'کرانڈی',
  'Premium Wash & Wear': 'پریمیم واش اینڈ ویئر',
  'Customer Supplied': 'گاہک کا اپنا کپڑا',

  // BUTTON_STYLE_OPTS
  'Premium': 'پریمیم',
  'Wooden': 'لکڑی',
  'Metal': 'دھات',
  'Matching Fabric': 'ملتا جلتا کپڑا',

  // COLOR_OPTS (names)
  'Black': 'کالا',
  'White': 'سفید',
  'Navy Blue': 'گہرا نیلا',
  'Sky Blue': 'آسمانی نیلا',
  'Grey': 'سرمئی',
  'Maroon': 'گہرا مرون',
  'Olive Green': 'زیتونی سبز',
  'Brown': 'بھورا',
  'Beige': 'بیج',
  'Red': 'سرخ',
  'Cream': 'کریمی',
  'Blue': 'نیلا',
  'Green': 'سبز',

  // POCKET_POSITION_OPTS / POCKET_DEPTH_OPTS
  'Left': 'بائیں',
  'Right': 'دائیں',
  'Both': 'دونوں',
  'Deep': 'گہری',
  'Extra Deep': 'زیادہ گہری',
};

/** "English / Urdu" for plain-text contexts (e.g. <option>) that can't hold
 * a <bdi>-wrapped span. Falls back to the English label alone if untranslated. */
export function bilingual(label: string): string {
  return URDU_LABELS[label] ? `${label} / ${URDU_LABELS[label]}` : label;
}
