export type Phase = 'menu' | 'day' | 'night' | 'won' | 'lost';
export type Weapon = 'hammer' | 'spear';

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
  merchantDay: number;
}
