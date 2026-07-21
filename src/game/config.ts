import type { Weapon } from './types';

export const MAX_BASE_HEALTH = 100;
export const REPAIR_PER_STEP = 20;
export const REPAIR_WOOD_COST = 20;
export const WRENCH_REPAIR_WOOD_COST = 15;
export const WATER_HEAL = 30;
export const FOOD_HEAL = 5;
export const SPEAR_COST = 50;
export const SPEAR_DAMAGE = 1.5;
export const SPEAR_RANGE_BONUS = 1.3;
export const AXE_COST = 50;
export const AXE_DAMAGE = 1.2;
export const AXE_ATTACK_COOLDOWN = 700;
export const WRENCH_DAMAGE = 2;
export const DEFAULT_ATTACK_COOLDOWN = 500;
export const WRENCH_ATTACK_COOLDOWN = 1000;

export const repairWoodCost = (weapon: Weapon) => weapon === 'wrench' ? WRENCH_REPAIR_WOOD_COST : REPAIR_WOOD_COST;
