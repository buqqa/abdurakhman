import type { CrateKind, InteractableObject } from './interactions';
import { BASE_POSITION, MAP_HEIGHT, MAP_WIDTH } from './mapConfig';

export type StructureKind = 'tent' | 'warehouse';

export interface WorldStructure {
  id: string;
  kind: StructureKind;
  x: number;
  y: number;
}

const randomCrate = (choices: CrateKind[]) => choices[Math.floor(Math.random() * choices.length)];

export function createStructure(kind: StructureKind, occupied: InteractableObject[]) {
  const width = kind === 'tent' ? 170 : 190;
  const height = kind === 'tent' ? 100 : 120;
  let position = { x: kind === 'tent' ? 470 : 850, y: kind === 'tent' ? 500 : 180 };

  for (let attempt = 0; attempt < 250; attempt += 1) {
    const candidate = {
      x: 55 + Math.random() * (MAP_WIDTH - width - 110),
      y: 55 + Math.random() * (MAP_HEIGHT - height - 110),
    };
    const center = { x: candidate.x + width / 2, y: candidate.y + height / 2 };
    const farFromBase = Math.hypot(center.x - BASE_POSITION.x, center.y - BASE_POSITION.y) > 300;
    const hasSpace = occupied.every((object) => Math.hypot(center.x - object.x, center.y - object.y) > 155);
    if (farFromBase && hasSpace) { position = candidate; break; }
  }

  const structure: WorldStructure = { id: `structure-${kind}`, kind, ...position };
  const kinds: CrateKind[] = kind === 'tent'
    ? ['crate-food', 'crate-food', 'crate-food']
    : ['crate-wood', 'crate-wood', randomCrate(['crate-wood', 'crate-food'])];
  const crates = kinds.map<InteractableObject>((crateKind, index) => ({
    id: `${structure.id}-crate-${index}`,
    kind: crateKind,
    x: position.x + 48 + index * 46,
    y: position.y + height - 13,
  }));
  const marker: InteractableObject = { id: `${structure.id}-marker`, kind: `structure-${kind}`, x: position.x + width / 2, y: position.y + height / 2 };
  return { structure, crates, marker };
}
