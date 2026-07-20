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
  isSprinter: boolean;
  isArmored: boolean;
  lastAttack: number;
  facingLeft: boolean;
  hitAt: number;
  spawnedAt: number;
  guardX?: number;
  guardY?: number;
}

export function createCarGuards(night: number, x: number, y: number): Zombie[] {
  return Array.from({ length: 5 }, (_, index) => {
    const angle = index / 5 * Math.PI * 2;
    const health = 6;
    return {
      id: `car-guard-${night}-${index}`, x: x + Math.cos(angle) * 82, y: y + Math.sin(angle) * 58,
      health, maxHealth: health, damage: 0, playerDamage: 10, speed: 34,
      isBoss: false, hasHammer: false, isExplosive: false, isSprinter: false, isArmored: false,
      lastAttack: 0, facingLeft: false, hitAt: 0, spawnedAt: Date.now(), guardX: x, guardY: y,
    };
  });
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
    const specialRoll = isBoss ? 1 : Math.random();
    const hasHammer = specialRoll < .1;
    const isExplosive = specialRoll >= .1 && specialRoll < .2;
    const isSprinter = specialRoll >= .2 && specialRoll < .3;
    const isArmored = specialRoll >= .3 && specialRoll < .4;
    const bossMultiplier = difficulty === 'HARDCORE' ? 3 : 2;
    const health = isBoss ? bossBaseHealth * bossMultiplier : isArmored ? 8 : normalHealth;
    return {
      id: `zombie-${night}-${index}`, ...spawnPoint(index), health, maxHealth: health,
      damage: hasHammer ? 20 : isArmored ? 15 : normalDamage * (isBoss ? bossMultiplier : 1),
      playerDamage: hasHammer ? 20 : isBoss ? 10 * bossMultiplier : isSprinter ? 5 : isArmored ? 15 : 10,
      speed: (25 + Math.min(night, 12)) * (isSprinter ? 2 : isArmored ? .5 : 1),
      isBoss, hasHammer, isExplosive, isSprinter, isArmored, lastAttack: 0, facingLeft: false, hitAt: 0, spawnedAt: 0,
    };
  });
}
