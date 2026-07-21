export type Phase = 'menu' | 'day' | 'night' | 'won' | 'lost';
export type Weapon = 'hammer' | 'spear' | 'axe' | 'wrench';

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
  hasWrench: boolean;
  hasSeenWrench: boolean;
  merchantDay: number;
}
