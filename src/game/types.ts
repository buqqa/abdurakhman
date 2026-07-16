export type Phase = 'menu' | 'day' | 'night' | 'won' | 'lost';
export type Weapon = 'axe' | 'spear';

export interface Fence { id: number; x: number; y: number }

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
  fences: Fence[];
  weapon: Weapon;
  merchantDay: number;
}
