interface GarmentPreviewProps {
  templateKey: string;
  templateLabel: string;
  color: string;
}

export function GarmentPreview({ templateKey, templateLabel, color }: GarmentPreviewProps) {
  const isKameez = templateKey === 'shalwar-kameez-men' || templateKey === 'shalwar-kameez-women';

  if (!isKameez) {
    return (
      <div className="preview-placeholder">
        No live preview for
        <br />
        <b>{templateLabel}</b>
      </div>
    );
  }

  return (
    <>
      <svg viewBox="0 0 160 220" width={160} height={220}>
        <path
          d="M55 10 L80 26 L105 10 L120 30 L108 46 L108 70 L130 200 L100 210 L100 130 L60 130 L60 210 L30 200 L52 70 L52 46 L40 30 Z"
          fill={color}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1.5}
        />
        <path d="M55 10 L80 26 L105 10" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={1.5} />
      </svg>
      <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>Live preview · {templateLabel}</div>
    </>
  );
}
