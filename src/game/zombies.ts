import { MAP_HEIGHT, MAP_WIDTH } from './mapConfig';

export interface Zombie {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  playerDamage: number;
  speed: number;
  isBoss: boolean;
  hasHammer: boolean;
  isExplosive: boolean;
  lastAttack: number;
  facingLeft: boolean;
  hitAt: number;
  spawnedAt: number;
}

function spawnPoint(index: number) {
  if (index % 2 === 0) return { x: MAP_WIDTH - 45, y: 45 + Math.random() * (MAP_HEIGHT - 90) };
  return { x: 45 + Math.random() * (MAP_WIDTH - 90), y: MAP_HEIGHT - 45 };
}

export function createZombieWave(night: number, difficulty: string) {
  const maxCount = Math.min(10, 2 + Math.ceil(night * .8));
  const count = 1 + Math.floor(Math.random() * maxCount);
  const normalHealth = 6;
  const bossBaseHealth = 4;
  const normalDamage = 3 + Math.floor((night - 1) / 5);

  return Array.from({ length: count }, (_, index): Zombie => {
    const isBoss = night % 5 === 0 && index === 0;
    const hasHammer = !isBoss && Math.random() < .1;
    const isExplosive = !isBoss && !hasHammer && Math.random() < .1;
    const bossMultiplier = difficulty === 'HARDCORE' ? 3 : 2;
    const health = isBoss ? bossBaseHealth * bossMultiplier : normalHealth;
    return {
      id: `zombie-${night}-${index}`, ...spawnPoint(index), health, maxHealth: health,
      damage: hasHammer ? 20 : normalDamage * (isBoss ? bossMultiplier : 1),
      playerDamage: hasHammer ? 20 : isBoss ? 10 * bossMultiplier : 10, speed: 25 + Math.min(night, 12),
      isBoss, hasHammer, isExplosive, lastAttack: 0, facingLeft: false, hitAt: 0, spawnedAt: 0,
    };
  });
}
