export type Phase = 'menu' | 'day' | 'night' | 'won' | 'lost';
export type Weapon = 'hammer' | 'spear' | 'axe' | 'sword' | 'wrench';
export interface MerchantVisit { day: number; x: number; y: number }

export interface GameState {
  day: number;
  phase: Phase;
  wood: number;
  food: number;
  water: number;
  playerHealth: number;
  baseHealth: number;
  message: string;
  completionTime: number | null;
  maxNights: number;
  difficulty: string;
  weapon: Weapon;
  hasSpear: boolean;
  hasAxe: boolean;
  hasSword: boolean;
  hasWrench: boolean;
  hasSeenWrench: boolean;
  merchantVisits: MerchantVisit[];
}
