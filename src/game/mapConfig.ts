export const MAP_WIDTH = 1200;
export const MAP_HEIGHT = 720;
export const MAP_BORDER = 0;
export const PLAYER_SIZE = 30;
export const PLAYER_EDGE_GAP = 6;
export const PLAYABLE_WIDTH = MAP_WIDTH - MAP_BORDER * 2;
export const PLAYABLE_HEIGHT = MAP_HEIGHT - MAP_BORDER * 2;
export const PLAYER_MAX_SPEED = 180;
export const PLAYER_ACCELERATION = 900;
export const PLAYER_FRICTION = 0.82;
export const BASE_POSITION = { x: 125, y: 120 } as const;
export const PLAYER_START = { x: 125, y: 225 } as const;
export const TREES = [
  { x: 260, y: 70 }, { x: 180, y: 350 }, { x: 665, y: 85 },
  { x: 700, y: 350 }, { x: 85, y: 235 }, { x: 580, y: 385 },
  { x: 910, y: 125 }, { x: 1060, y: 540 }, { x: 820, y: 610 }, { x: 430, y: 570 },
] as const;
