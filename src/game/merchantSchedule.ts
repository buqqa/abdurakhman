import { WORLD_OBJECTS } from './interactions';
import { MAP_HEIGHT, MAP_WIDTH } from './mapConfig';
import type { MerchantVisit } from './types';

const visitRanges = (difficulty: string): Array<[number, number]> => difficulty === 'HARDCORE'
  ? [[5, 10], [15, 20], [25, 30]]
  : difficulty === 'SURVIVOR' ? [[5, 10], [15, 20]] : [[5, 10]];

const randomDay = (from: number, to: number) => from + Math.floor(Math.random() * (to - from + 1));

export function createMerchantVisits(difficulty: string): MerchantVisit[] {
  const visits: MerchantVisit[] = [];
  return visitRanges(difficulty).map(([from, to], index) => {
    let position = { x: 1100, y: 680 };
    for (let attempt = 0; attempt < 200; attempt += 1) {
      const candidate = { x: MAP_WIDTH / 2 + 70 + Math.random() * 475, y: 55 + Math.random() * (MAP_HEIGHT - 110) };
      const clearOfWorld = WORLD_OBJECTS.every((object) => Math.hypot(candidate.x - object.x, candidate.y - object.y) > (object.kind === 'building' ? 175 : 115));
      const clearOfVisits = visits.every((visit) => Math.hypot(candidate.x - visit.x, candidate.y - visit.y) > 150);
      if (clearOfWorld && clearOfVisits) { position = candidate; break; }
    }
    const visit = { day: index === 0 ? 1 : randomDay(from, to), ...position };
    visits.push(visit);
    return visit;
  });
}
