import { useEffect, useRef, useState } from 'react';
import type { MerchantVisit, Phase } from '../types';
import { createDailyResources, WORLD_OBJECTS, type InteractableObject } from '../interactions';
import { createStructure, type StructureKind, type WorldStructure } from '../structures';
import type { SharedWorld, WorldTake } from '../multiplayer';

interface Options {
  authoritative: boolean;
  day: number;
  maxNights: number;
  phase: Phase;
  merchantVisits: MerchantVisit[];
  sharedWorld?: SharedWorld;
  worldTakes: Pick<WorldTake, 'id' | 'nonce'>[];
  onWorldState: (world: SharedWorld) => void;
}

export function useWorldState({ authoritative, day, maxNights, phase, merchantVisits, sharedWorld, worldTakes, onWorldState }: Options) {
  const [objects, setObjects] = useState<InteractableObject[]>(WORLD_OBJECTS);
  const [structures, setStructures] = useState<WorldStructure[]>([]);
  const spawnedDays = useRef(new Set<number>());
  const spawnedStructures = useRef(new Set<StructureKind>());
  const structureDays = useRef({
    tent: 1,
    warehouse: 10 + Math.floor(Math.random() * 11),
    car: Math.min(1, maxNights),
  });
  const merchantReservations: InteractableObject[] = merchantVisits.map((visit, index) => ({ id: `merchant-reservation-${index}`, kind: 'merchant-reservation', x: visit.x, y: visit.y }));

  useEffect(() => {
    if (authoritative) onWorldState({ objects, structures, spawnedStructures: [...spawnedStructures.current] });
  }, [authoritative, objects, onWorldState, structures]);
  useEffect(() => {
    if (authoritative || !sharedWorld) return;
    setObjects(sharedWorld.objects);
    setStructures(sharedWorld.structures);
    spawnedStructures.current = new Set(sharedWorld.spawnedStructures);
  }, [authoritative, sharedWorld]);
  useEffect(() => {
    if (worldTakes.length) setObjects((current) => current.filter((item) => !worldTakes.some((take) => take.id === item.id)));
  }, [worldTakes]);
  useEffect(() => {
    if (!authoritative || day < 2 || phase !== 'day' || spawnedDays.current.has(day)) return;
    spawnedDays.current.add(day);
    const resources = createDailyResources(day, [...objects, ...merchantReservations]);
    if (resources.length) setObjects((current) => [...current, ...resources]);
  }, [authoritative, day, phase]);
  useEffect(() => {
    if (!authoritative) return;
    const expiredIds = structures.filter((structure) => structure.spawnedDay < day
      && (structure.kind === 'car' ? phase === 'night' : phase === 'day')).map((structure) => structure.id);
    if (!expiredIds.length) return;
    setStructures((current) => current.filter((structure) => !expiredIds.includes(structure.id)));
    setObjects((current) => current.filter((object) => !expiredIds.some((id) => object.id.startsWith(`${id}-`))));
  }, [authoritative, day, phase, structures]);
  useEffect(() => {
    if (!authoritative) return;
    const available: StructureKind[] = phase === 'day' ? ['tent', 'warehouse', 'car'] : phase === 'night' ? ['car'] : [];
    const ready = available.filter((kind) => day >= structureDays.current[kind] && !spawnedStructures.current.has(kind));
    const additions: ReturnType<typeof createStructure>[] = [];
    const occupied = [...objects, ...merchantReservations];
    ready.forEach((kind) => {
      spawnedStructures.current.add(kind);
      const spawn = createStructure(kind, occupied, day);
      additions.push(spawn);
      occupied.push(spawn.marker, ...spawn.crates);
    });
    if (additions.length) {
      setStructures((current) => [...current, ...additions.map((spawn) => spawn.structure)]);
      setObjects((current) => [...current, ...additions.flatMap((spawn) => [spawn.marker, ...spawn.crates])]);
    }
  }, [authoritative, day, merchantVisits, objects, phase]);

  return { objects, setObjects, structures };
}
