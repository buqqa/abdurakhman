import type { CSSProperties } from 'react';

interface Props { className?: string; style?: CSSProperties }

export function ChickenLeg({ className = '', style }: Props) {
  return (
    <span className={`chicken-leg ${className}`} style={style} aria-label="Куриная ножка">
      <span className="chicken-leg__meat"><i /></span>
      <span className="chicken-leg__bone"><i /><b /></span>
    </span>
  );
}
