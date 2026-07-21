import type { CSSProperties } from 'react';

export function WeaponItem({ kind, className = '', style }: { kind: 'spear' | 'axe' | 'sword' | 'wrench'; className?: string; style?: CSSProperties }) {
  const label = kind === 'spear' ? 'Копьё' : kind === 'axe' ? 'Топор' : kind === 'sword' ? 'Меч' : 'Гаечный ключ';
  return <span className={`weapon-item weapon-item--${kind} ${className}`} style={style} aria-label={label}><i /></span>;
}
