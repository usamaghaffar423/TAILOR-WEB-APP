export function StitchDivider({ tight }: { tight?: boolean }) {
  return <div className={`stitch${tight ? ' tight' : ''}`} />;
}
