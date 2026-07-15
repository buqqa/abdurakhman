import type { CSSProperties } from 'react';

export function WaterBottle({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <span className={`water-bottle ${className}`} style={style} aria-label="Бутылка воды">
      <span className="water-bottle__cap" />
      <span className="water-bottle__body"><i /></span>
    </span>
  );
}
