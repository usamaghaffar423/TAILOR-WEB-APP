import type { ReactNode } from 'react';

function StyleIcon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 48 54" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const STYLE_TORSO = <path d="M6 18 L16 6 L32 6 L42 18 L42 50 L6 50 Z" />;
export const CUSTOM_ICON = (
  <StyleIcon>
    <path d="M10 38 L30 18 L34 22 L14 42 L9 43 Z" />
    <path d="M27 21 L31 25" />
  </StyleIcon>
);

export const SLEEVE_ICON: Record<string, ReactNode> = {
  Straight: <StyleIcon><path d="M17 4 L31 4 L31 44 L17 44 Z" /></StyleIcon>,
  Regular: <StyleIcon><path d="M17 4 L31 4 L29 44 L19 44 Z" /></StyleIcon>,
  'Slightly Tapered': <StyleIcon><path d="M16 4 L32 4 L27 44 L21 44 Z" /></StyleIcon>,
  'Wide Traditional': <StyleIcon><path d="M14 4 L34 4 L30 44 L18 44 Z" /></StyleIcon>,
};

export const CUFF_ICON: Record<string, ReactNode> = {
  Simple: (
    <StyleIcon>
      <path d="M16 4 L32 4 L30 41 L18 41 Z" />
      <line x1={18} y1={41} x2={30} y2={41} strokeWidth={2.2} />
    </StyleIcon>
  ),
  'Single Button': (
    <StyleIcon>
      <path d="M16 4 L32 4 L30 32 L18 32 Z" />
      <rect x={17} y={32} width={14} height={13} rx={1.5} />
      <circle cx={24} cy={38.5} r={1.4} fill="currentColor" stroke="none" />
    </StyleIcon>
  ),
  'Double Button': (
    <StyleIcon>
      <path d="M16 4 L32 4 L30 32 L18 32 Z" />
      <rect x={17} y={32} width={14} height={13} rx={1.5} />
      <circle cx={21.5} cy={38.5} r={1.2} fill="currentColor" stroke="none" />
      <circle cx={26.5} cy={38.5} r={1.2} fill="currentColor" stroke="none" />
    </StyleIcon>
  ),
  'Designer Cuff': (
    <StyleIcon>
      <path d="M16 4 L32 4 L30 32 L18 32 Z" />
      <path d="M17 32 L31 32 L31 39 Q31 45 24 45 Q17 45 17 39 Z" />
    </StyleIcon>
  ),
};

export const COLLAR_ICON: Record<string, ReactNode> = {
  'Classic Band Collar': (
    <StyleIcon>
      {STYLE_TORSO}
      <rect x={14} y={4} width={20} height={5} rx={1.5} />
    </StyleIcon>
  ),
  'Simple Collar': (
    <StyleIcon>
      {STYLE_TORSO}
      <path d="M17 6 L24 15 L20 18 L12 8 Z" />
      <path d="M31 6 L24 15 L28 18 L36 8 Z" />
    </StyleIcon>
  ),
  'Chinese Collar': (
    <StyleIcon>
      {STYLE_TORSO}
      <rect x={21} y={1} width={6} height={4} rx={1} />
    </StyleIcon>
  ),
  'Open Collar': <StyleIcon><path d="M6 18 L16 6 L24 20 L32 6 L42 18 L42 50 L6 50 Z" /></StyleIcon>,
  'No Collar': <StyleIcon><path d="M6 18 L16 6 Q24 12 32 6 L42 18 L42 50 L6 50 Z" /></StyleIcon>,
};

export const NECK_ICON: Record<string, ReactNode> = {
  Round: <StyleIcon><path d="M6 18 L16 6 Q24 15 32 6 L42 18 L42 50 L6 50 Z" /></StyleIcon>,
  'V-Neck': <StyleIcon><path d="M6 18 L16 6 L24 19 L32 6 L42 18 L42 50 L6 50 Z" /></StyleIcon>,
  'Straight Opening': <StyleIcon>{STYLE_TORSO}</StyleIcon>,
  'Traditional Opening': <StyleIcon><path d="M6 18 L16 6 L21 6 L24 11 L27 6 L32 6 L42 18 L42 50 L6 50 Z" /></StyleIcon>,
};

function lengthIcon(markerY: number): ReactNode {
  return (
    <StyleIcon>
      <rect x={14} y={4} width={20} height={48} rx={2} strokeOpacity={0.35} />
      <line x1={10} y1={markerY} x2={38} y2={markerY} strokeWidth={2.4} />
      <path d={`M10 ${markerY} l3 -3M10 ${markerY} l3 3M38 ${markerY} l-3 -3M38 ${markerY} l-3 3`} strokeWidth={1.4} />
    </StyleIcon>
  );
}
export const LENGTH_ICON: Record<string, ReactNode> = {
  Short: lengthIcon(22),
  Standard: lengthIcon(32),
  Long: lengthIcon(40),
  'Extra Long': lengthIcon(47),
};

export const FIT_ICON: Record<string, ReactNode> = {
  'Traditional Loose': <StyleIcon><path d="M8 10 L16 4 L32 4 L40 10 L40 48 L8 48 Z" /></StyleIcon>,
  Regular: <StyleIcon><path d="M10 10 L17 4 L31 4 L38 10 L36 48 L12 48 Z" /></StyleIcon>,
  'Comfort Fit': <StyleIcon><path d="M11 10 L17 4 L31 4 L37 10 L34 48 L14 48 Z" /></StyleIcon>,
  'Semi-Slim': <StyleIcon><path d="M12 10 L18 4 L30 4 L36 10 L31 48 L17 48 Z" /></StyleIcon>,
  Slim: <StyleIcon><path d="M13 10 L18 4 L30 4 L35 10 L28 48 L20 48 Z" /></StyleIcon>,
};
export function recommendedFit(region?: string): string {
  return region === 'Pukhtoon' ? 'Traditional Loose' : 'Regular';
}

export const PLACKET_ICON: Record<string, ReactNode> = {
  Plain: <StyleIcon>{STYLE_TORSO}</StyleIcon>,
  'Simple Button Placket': (
    <StyleIcon>
      {STYLE_TORSO}
      <line x1={24} y1={10} x2={24} y2={47} />
      <circle cx={24} cy={18} r={1.1} fill="currentColor" stroke="none" />
      <circle cx={24} cy={27} r={1.1} fill="currentColor" stroke="none" />
      <circle cx={24} cy={36} r={1.1} fill="currentColor" stroke="none" />
    </StyleIcon>
  ),
  'Traditional Patti': (
    <StyleIcon>
      {STYLE_TORSO}
      <line x1={21} y1={10} x2={21} y2={47} />
      <line x1={27} y1={10} x2={27} y2={47} />
      <circle cx={24} cy={18} r={1.1} fill="currentColor" stroke="none" />
      <circle cx={24} cy={27} r={1.1} fill="currentColor" stroke="none" />
      <circle cx={24} cy={36} r={1.1} fill="currentColor" stroke="none" />
    </StyleIcon>
  ),
  'Embroidered Patti': (
    <StyleIcon>
      {STYLE_TORSO}
      <line x1={21} y1={10} x2={21} y2={47} strokeWidth={1.2} />
      <line x1={27} y1={10} x2={27} y2={47} strokeWidth={1.2} />
      <path d="M21 14 L27 17 L21 20 L27 23 L21 26 L27 29 L21 32" strokeWidth={1} />
    </StyleIcon>
  ),
  'Designer Front': (
    <StyleIcon>
      {STYLE_TORSO}
      <path d="M19 9 L29 20 L26 47" strokeWidth={1.6} />
      <circle cx={27} cy={26} r={1.1} fill="currentColor" stroke="none" />
      <circle cx={26.5} cy={36} r={1.1} fill="currentColor" stroke="none" />
    </StyleIcon>
  ),
  Custom: CUSTOM_ICON,
};

export const POCKET_ICON: Record<string, ReactNode> = {
  'No Pocket': <StyleIcon>{STYLE_TORSO}</StyleIcon>,
  '1 Chest Pocket': (
    <StyleIcon>
      {STYLE_TORSO}
      <rect x={12} y={25} width={10} height={10} rx={1.2} />
    </StyleIcon>
  ),
  '2 Chest Pockets': (
    <StyleIcon>
      {STYLE_TORSO}
      <rect x={10} y={25} width={9} height={9} rx={1.2} />
      <rect x={29} y={25} width={9} height={9} rx={1.2} />
    </StyleIcon>
  ),
  '2 Side Pockets': (
    <StyleIcon>
      {STYLE_TORSO}
      <rect x={8} y={34} width={8} height={10} rx={1.2} />
      <rect x={32} y={34} width={8} height={10} rx={1.2} />
    </StyleIcon>
  ),
  '1 Chest + 2 Side': (
    <StyleIcon>
      {STYLE_TORSO}
      <rect x={17} y={16} width={14} height={9} rx={1.2} />
      <rect x={8} y={34} width={7} height={9} rx={1.2} />
      <rect x={33} y={34} width={7} height={9} rx={1.2} />
    </StyleIcon>
  ),
};

const SHALWAR_LEG_BASE = (
  <>
    <rect x={15} y={2} width={18} height={5} rx={1.5} />
    <path d="M15 7 L15 46 L21 46 L23 22 L25 22 L27 46 L33 46 L33 7 Z" />
  </>
);
export const POCKET_SHALWAR_ICON: Record<string, ReactNode> = {
  'No Pocket': <StyleIcon>{SHALWAR_LEG_BASE}</StyleIcon>,
  '1 Side Pocket': (
    <StyleIcon>
      {SHALWAR_LEG_BASE}
      <path d="M27 12 L32 16" strokeWidth={1.6} />
    </StyleIcon>
  ),
  '2 Side Pockets': (
    <StyleIcon>
      {SHALWAR_LEG_BASE}
      <path d="M21 12 L16 16M27 12 L32 16" strokeWidth={1.6} />
    </StyleIcon>
  ),
  'Deep Pockets': (
    <StyleIcon>
      {SHALWAR_LEG_BASE}
      <path d="M20 11 L14 18M28 11 L34 18" strokeWidth={1.6} />
    </StyleIcon>
  ),
};
export const POCKET_POSITION_OPTS = ['Left', 'Right', 'Both'];
export const POCKET_DEPTH_OPTS = ['Standard', 'Deep', 'Extra Deep'];

export const DAMAN_ICON: Record<string, ReactNode> = {
  'Straight Hem': (
    <StyleIcon>
      <path d="M10 4 L38 4 L38 44 L10 44 Z" />
      <line x1={10} y1={44} x2={38} y2={44} strokeWidth={2.4} />
    </StyleIcon>
  ),
  'Round Hem': <StyleIcon><path d="M10 4 L38 4 L38 36 Q38 44 30 44 L18 44 Q10 44 10 36 Z" /></StyleIcon>,
  'Side Slits (Chaak)': (
    <StyleIcon>
      <path d="M10 4 L38 4 L38 44 L10 44 Z" />
      <line x1={10} y1={44} x2={38} y2={44} strokeWidth={2.4} />
      <line x1={13} y1={44} x2={13} y2={33} />
      <line x1={35} y1={44} x2={35} y2={33} />
    </StyleIcon>
  ),
};

// Legacy — kept so orders saved before the Pukhtoon/Punjabi update still
// render their salwar style correctly (see getOrderShalwarStyle in orders.ts helpers).
export const SALWAR_ICON: Record<string, ReactNode> = {
  'Plain Shalwar': <StyleIcon>{SHALWAR_LEG_BASE}</StyleIcon>,
  'Pleated Shalwar': (
    <StyleIcon>
      <rect x={12} y={2} width={24} height={5} rx={1.5} />
      <path d="M12 7 L12 46 L20 46 L22 22 L26 22 L28 46 L36 46 L36 7 Z" />
      <line x1={16} y1={7} x2={17} y2={22} />
      <line x1={20} y1={7} x2={20} y2={22} />
      <line x1={28} y1={7} x2={28} y2={22} />
      <line x1={32} y1={7} x2={31} y2={22} />
    </StyleIcon>
  ),
  'Tulip Shalwar': (
    <StyleIcon>
      <rect x={14} y={2} width={20} height={5} rx={1.5} />
      <path d="M14 7 C11 20 13 28 20 30 L21 46 L25 46 L25 30 M23 30 L23 46 L27 46 L28 30 C35 28 37 20 34 7 Z" />
    </StyleIcon>
  ),
  'Trouser Style': (
    <StyleIcon>
      <rect x={15} y={2} width={18} height={5} rx={1.5} />
      <rect x={14} y={7} width={9} height={39} rx={1.5} />
      <rect x={25} y={7} width={9} height={39} rx={1.5} />
      <line x1={18.5} y1={10} x2={18.5} y2={43} />
      <line x1={29.5} y1={10} x2={29.5} y2={43} />
    </StyleIcon>
  ),
  'Patiala Style': (
    <StyleIcon>
      <rect x={10} y={2} width={28} height={5} rx={1.5} />
      <path d="M10 7 L10 38 Q10 46 17 46 L20 46 L22 22 L26 22 L28 46 L31 46 Q38 46 38 38 L38 7 Z" />
      <line x1={14} y1={7} x2={15} y2={22} />
      <line x1={18} y1={7} x2={18} y2={22} />
      <line x1={30} y1={7} x2={30} y2={22} />
      <line x1={34} y1={7} x2={33} y2={22} />
      <rect x={16} y={42} width={8} height={5} rx={1.5} />
      <rect x={24} y={42} width={8} height={5} rx={1.5} />
    </StyleIcon>
  ),
};

export const REGIONAL_ICON: Record<string, ReactNode> = {
  Pukhtoon: (
    <StyleIcon>
      <rect x={9} y={2} width={30} height={5} rx={1.5} />
      <path d="M9 7 C7 22 10 32 19 34 L20 46 L26 46 L26 34 M22 34 L22 46 L28 46 L29 34 C38 32 41 22 39 7 Z" />
    </StyleIcon>
  ),
  Punjabi: (
    <StyleIcon>
      <rect x={14} y={2} width={20} height={5} rx={1.5} />
      <path d="M14 7 L15 40 L21 46 L23 22 L25 22 L27 46 L33 40 L34 7 Z" />
    </StyleIcon>
  ),
};

export const PUKHTOON_SHALWAR_ICON: Record<string, ReactNode> = {
  'Traditional Wide': REGIONAL_ICON.Pukhtoon,
  'Extra Wide Pukhtoon': (
    <StyleIcon>
      <rect x={7} y={2} width={34} height={5} rx={1.5} />
      <path d="M7 7 C5 24 9 34 19 36 L20 46 L26 46 L26 36 M22 36 L22 46 L28 46 L29 36 C39 34 43 24 41 7 Z" />
    </StyleIcon>
  ),
  'Medium Width': (
    <StyleIcon>
      <rect x={12} y={2} width={24} height={5} rx={1.5} />
      <path d="M12 7 L11 26 C11 32 15 35 20 36 L21 46 L25 46 L25 36 M23 36 L23 46 L27 46 L28 36 C33 35 37 32 37 26 L36 7 Z" />
    </StyleIcon>
  ),
  'Modern Pukhtoon': (
    <StyleIcon>
      <rect x={14} y={2} width={20} height={5} rx={1.5} />
      <path d="M14 7 L13 28 C13 32 16 34 20 35 L21 46 L25 46 L25 35 M23 35 L23 46 L27 46 L28 35 C32 34 35 32 35 28 L34 7 Z" />
    </StyleIcon>
  ),
};

export const PUNJABI_SHALWAR_ICON: Record<string, ReactNode> = {
  'Classic Punjabi': (
    <StyleIcon>
      <rect x={12} y={2} width={24} height={5} rx={1.5} />
      <path d="M12 7 L13 38 L20 46 L22 22 L26 22 L28 46 L35 38 L36 7 Z" />
    </StyleIcon>
  ),
  'Straight Punjabi': (
    <StyleIcon>
      <rect x={14} y={2} width={20} height={5} rx={1.5} />
      <rect x={13} y={7} width={10} height={39} rx={1.5} />
      <rect x={25} y={7} width={10} height={39} rx={1.5} />
    </StyleIcon>
  ),
  'Moderate Width': <StyleIcon>{SHALWAR_LEG_BASE}</StyleIcon>,
  'Narrow / Modern': (
    <StyleIcon>
      <rect x={16} y={2} width={16} height={5} rx={1.5} />
      <rect x={16} y={7} width={8} height={39} rx={1.5} />
      <rect x={26} y={7} width={8} height={39} rx={1.5} />
    </StyleIcon>
  ),
};

export const MORI_ICON: Record<string, ReactNode> = {
  'Very Wide': (
    <StyleIcon>
      <path d="M18 4 L30 4 L38 44 L32 48 L16 48 L10 44 Z" />
      <line x1={16} y1={48} x2={32} y2={48} strokeWidth={2.2} />
    </StyleIcon>
  ),
  Wide: (
    <StyleIcon>
      <path d="M19 4 L29 4 L35 44 L30 48 L18 48 L13 44 Z" />
      <line x1={18} y1={48} x2={30} y2={48} strokeWidth={2.2} />
    </StyleIcon>
  ),
  Medium: (
    <StyleIcon>
      <path d="M20 4 L28 4 L32 44 L28 48 L20 48 L16 44 Z" />
      <line x1={20} y1={48} x2={28} y2={48} strokeWidth={2.2} />
    </StyleIcon>
  ),
  Narrow: (
    <StyleIcon>
      <path d="M21 4 L27 4 L29 44 L26 48 L22 48 L19 44 Z" />
      <line x1={22} y1={48} x2={26} y2={48} strokeWidth={2.2} />
    </StyleIcon>
  ),
  Custom: CUSTOM_ICON,
};

export const WAIST_TYPE_ICON: Record<string, ReactNode> = {
  Elastic: (
    <StyleIcon>
      <rect x={10} y={20} width={28} height={10} rx={5} />
      <path d="M12 25 Q16 21 20 25 Q24 29 28 25 Q32 21 36 25" />
    </StyleIcon>
  ),
  'Nada / Drawstring': (
    <StyleIcon>
      <rect x={10} y={20} width={28} height={8} rx={2} />
      <path d="M22 24 Q20 30 16 32 M26 24 Q28 30 32 32" strokeWidth={1.6} />
      <circle cx={24} cy={24} r={1.3} fill="currentColor" stroke="none" />
    </StyleIcon>
  ),
  'Button + Nada': (
    <StyleIcon>
      <rect x={10} y={18} width={28} height={8} rx={2} />
      <circle cx={18} cy={22} r={1.6} fill="currentColor" stroke="none" />
      <path d="M28 22 Q26 28 22 30 M32 22 Q34 28 38 30" strokeWidth={1.6} />
    </StyleIcon>
  ),
  'Traditional Waist': <StyleIcon><rect x={9} y={18} width={30} height={12} rx={2} /></StyleIcon>,
};

export const EDIT_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z" />
  </svg>
);
export const PAYMENT_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </svg>
);
export const WHATSAPP_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.2-1.3-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.2-.4.1-.2 0-.3 0-.5 0-.1-.6-1.5-.9-2-.2-.5-.5-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.3 0 1.4 1 2.7 1.1 2.9.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.6-.7 1.9-1.3.2-.6.2-1.1.2-1.3-.1-.1-.3-.2-.5-.3z" />
    <path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2z" fill="none" stroke="currentColor" strokeWidth={1.6} />
  </svg>
);
