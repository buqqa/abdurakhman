import { MAP_HEIGHT, MAP_WIDTH } from './mapConfig';

export interface Zombie {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  isBoss: boolean;
  lastAttack: number;
  facingLeft: boolean;
  hitAt: number;
}

function spawnPoint(index: number) {
  if (index % 2 === 0) return { x: MAP_WIDTH - 45, y: 45 + Math.random() * (MAP_HEIGHT - 90) };
  return { x: 45 + Math.random() * (MAP_WIDTH - 90), y: MAP_HEIGHT - 45 };
}

export function createZombieWave(night: number) {
  const maxCount = Math.min(10, 2 + Math.ceil(night * .8));
  const count = 1 + Math.floor(Math.random() * maxCount);
  const normalHealth = 4 + Math.floor((night - 1) / 3);
  const normalDamage = 3 + Math.floor((night - 1) / 5);

  return Array.from({ length: count }, (_, index): Zombie => {
    const isBoss = night % 5 === 0 && index === 0;
    const health = normalHealth * (isBoss ? 2 : 1);
    return {
      id: `zombie-${night}-${index}`, ...spawnPoint(index), health, maxHealth: health,
      damage: normalDamage * (isBoss ? 2 : 1), speed: (25 + Math.min(night, 12)) * (isBoss ? 0.78 : 1),
      isBoss, lastAttack: 0, facingLeft: false, hitAt: 0,
    };
  });
}
