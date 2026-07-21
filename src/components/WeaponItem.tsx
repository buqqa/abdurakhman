import type { Weapon } from '../game/types';
import type { CSSProperties } from 'react';

export function WeaponItem({ kind, className = '', style }: { kind: Exclude<Weapon, 'hammer'>; className?: string; style?: CSSProperties }) {
  return <span className={`weapon-item weapon-item--${kind} ${className}`} style={style} aria-label={kind === 'spear' ? 'Копьё' : 'Гаечный ключ'}><i /></span>;
}
