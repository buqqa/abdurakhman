import { BASE_POSITION, MAP_HEIGHT, MAP_WIDTH, TREES } from './mapConfig';

export interface InteractableObject {
  id: string;
  kind: string;
  x: number;
  y: number;
}

export type CrateKind = 'crate-food' | 'crate-wood' | 'crate-empty' | 'crate-wrench';

export type InteractionHandler = (object: InteractableObject) => void;
export type InteractionHandlers = Record<string, InteractionHandler | undefined>;

export const INTERACTION_DISTANCE = 72;
export const HARVEST_DISTANCE = 100;

export function findNearestObject(player: { x: number; y: number }, objects: InteractableObject[]) {
  return objects.reduce<{ object?: InteractableObject; distance: number }>((nearest, object) => {
    const distance = Math.hypot(object.x - player.x, object.y - player.y);
    return distance < nearest.distance ? { object, distance } : nearest;
  }, { distance: Number.POSITIVE_INFINITY });
}

const startingCrateCount = Math.floor(Math.random() * 3);
const startingCrates: InteractableObject[] = [
  { id: 'starting-crate-1', kind: Math.random() < .15 ? 'crate-empty' : 'crate-food', x: 500, y: 105 },
  { id: 'starting-crate-2', kind: Math.random() < .15 ? 'crate-empty' : 'crate-food', x: 625, y: 300 },
].slice(0, startingCrateCount);

export const WORLD_OBJECTS: InteractableObject[] = [
  ...TREES.map((tree, index) => ({ id: `tree-${index}`, kind: 'tree', x: tree.x + 25, y: tree.y + 50 })),
  ...startingCrates,
  { id: 'base', kind: 'building', ...BASE_POSITION },
];

export function createDailyResources(day: number, occupied: InteractableObject[]): InteractableObject[] {
  const resources: InteractableObject[] = [];
  const createPoint = () => {
    for (let attempts = 0; attempts < 200; attempts += 1) {
      const point = { x: 65 + Math.random() * (MAP_WIDTH - 130), y: 65 + Math.random() * (MAP_HEIGHT - 130) };
      const nearbyObjects = [...occupied, ...resources].some((object) => Math.hypot(point.x - object.x, point.y - object.y) < (object.kind.startsWith('structure-') ? 140 : 70));
      if (Math.hypot(point.x - BASE_POSITION.x, point.y - BASE_POSITION.y) >= 130 && !nearbyObjects) return point;
    }
    return undefined;
  };
  const addRandom = (kind: 'tree' | CrateKind) => {
    const count = Math.floor(Math.random() * 3);
    for (let index = 0; index < count; index += 1) {
      const point = createPoint();
      if (point) resources.push({ id: `daily-${kind}-${day}-${index}`, kind, ...point });
    }
  };
  addRandom('tree');
  const crateRoll = Math.random();
  const crateCount = crateRoll < .35 ? 0 : crateRoll < .8 ? 1 : 2;
  for (let index = 0; index < crateCount; index += 1) {
    const point = createPoint();
    const kind: CrateKind = Math.random() < .15 ? 'crate-empty' : 'crate-food';
    if (point) resources.push({ id: `daily-${kind}-${day}-${index}`, kind, ...point });
  }
  return resources;
}
