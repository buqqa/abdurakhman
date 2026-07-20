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

interface SpawnPosition { x: number; y: number }

const hasSpawnSpace = (position: SpawnPosition, occupied: SpawnPosition[]) => occupied.every((other) => Math.hypot(position.x - other.x, position.y - other.y) >= 48);

export function createCarGuards(night: number, x: number, y: number, occupied: SpawnPosition[] = []): Zombie[] {
  const positions = [...occupied];
  return Array.from({ length: 5 }, (_, index) => {
    let position = { x, y };
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const angle = (index + attempt / 5) / 5 * Math.PI * 2;
      const radius = 72 + attempt % 3 * 12;
      const candidate = { x: x + Math.cos(angle) * radius, y: y + Math.sin(angle) * radius * .72 };
      if (hasSpawnSpace(candidate, positions)) { position = candidate; break; }
    }
    positions.push(position);
    const health = 6;
    return {
      id: `car-guard-${night}-${index}`, ...position,
      health, maxHealth: health, damage: 0, playerDamage: 10, speed: 34,
      isBoss: false, hasHammer: false, isExplosive: false, isSprinter: false, isArmored: false,
      lastAttack: 0, facingLeft: false, hitAt: 0, spawnedAt: Date.now(), guardX: x, guardY: y,
    };
  });
}

function spawnPoint(index: number, occupied: SpawnPosition[]) {
  let fallback = { x: MAP_WIDTH - 45, y: 45 };
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const candidate = index % 2 === 0
      ? { x: MAP_WIDTH - 45, y: 45 + Math.random() * (MAP_HEIGHT - 90) }
      : { x: 45 + Math.random() * (MAP_WIDTH - 90), y: MAP_HEIGHT - 45 };
    fallback = candidate;
    if (hasSpawnSpace(candidate, occupied)) return candidate;
  }
  return fallback;
}

export function createZombieWave(night: number, difficulty: string) {
  const maxCount = Math.min(10, 2 + Math.ceil(night * .8));
  const count = 1 + Math.floor(Math.random() * maxCount);
  const normalHealth = 6;
  const bossBaseHealth = 4;
  const normalDamage = 3 + Math.floor((night - 1) / 5);

  const positions: SpawnPosition[] = [];
  return Array.from({ length: count }, (_, index): Zombie => {
    const isBoss = night % 5 === 0 && index === 0;
    const specialRoll = isBoss ? 1 : Math.random();
    const hasHammer = specialRoll < .1;
    const isExplosive = specialRoll >= .1 && specialRoll < .2;
    const isSprinter = specialRoll >= .2 && specialRoll < .3;
    const isArmored = specialRoll >= .3 && specialRoll < .4;
    const bossMultiplier = difficulty === 'HARDCORE' ? 3 : 2;
    const health = isBoss ? bossBaseHealth * bossMultiplier : isArmored ? 8 : normalHealth;
    const position = spawnPoint(index, positions);
    positions.push(position);
    return {
      id: `zombie-${night}-${index}`, ...position, health, maxHealth: health,
      damage: hasHammer ? 20 : isArmored ? 15 : normalDamage * (isBoss ? bossMultiplier : 1),
      playerDamage: hasHammer ? 20 : isBoss ? 10 * bossMultiplier : isSprinter ? 5 : isArmored ? 15 : 10,
      speed: (25 + Math.min(night, 12)) * (isSprinter ? 2 : isArmored ? .5 : 1),
      isBoss, hasHammer, isExplosive, isSprinter, isArmored, lastAttack: 0, facingLeft: false, hitAt: 0, spawnedAt: 0,
    };
  });
}
