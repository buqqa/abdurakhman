import { useCallback, useEffect, useRef, useState } from 'react';
import { BASE_POSITION, FENCE_CENTER, FENCE_SLOTS, MAP_HEIGHT, MAP_WIDTH, PLAYER_START } from '../game/mapConfig';
import { createDailyResources, WORLD_OBJECTS, type CrateKind, type InteractionHandlers } from '../game/interactions';
import { InteractionSystem } from '../game/systems/InteractionSystem';
import { RepairSystem } from '../game/systems/RepairSystem';
import { AttackSystem } from '../game/systems/AttackSystem';
import type { Phase } from '../game/types';
import { GameCamera } from './GameCamera';
import { PlayerController, type Position } from './PlayerController';
import { BaseStructure } from './BaseStructure';
import { BuildSystem } from '../game/systems/BuildSystem';
import type { Fence } from '../game/types';
import { playGameSound } from '../lib/gameAudio';
import { useZombieWave } from '../game/systems/useZombieWave';
import { ZombieSprite } from './ZombieSprite';
import { LootCrate } from './LootCrate';
import { WorldStructures } from './WorldStructures';
import { createStructure, type StructureKind, type WorldStructure } from '../game/structures';

interface Footprint extends Position { id: number }

const fenceRotation = (position: Position) => Math.atan2(position.y - FENCE_CENTER.y, position.x - FENCE_CENTER.x) * 180 / Math.PI + 90;

interface Props { playerNickname: string; phase: Phase; day: number; baseHealth: number; fences: Fence[]; handlers: InteractionHandlers; onUnavailable: () => void; onAttack: () => void; onHarvest: () => void; onCrateLoot: (kind: CrateKind) => void; onBuildFence: (position: Position) => void; onPlayerDamage: (damage: number) => void; onBaseDamage: (damage: number) => void; onNightCleared: () => void }

export function ForestMap({ playerNickname, phase, day, baseHealth, fences, handlers, onUnavailable, onAttack, onHarvest, onCrateLoot, onBuildFence, onPlayerDamage, onBaseDamage, onNightCleared }: Props) {
  const isNight = phase === 'night';
  const canMove = phase === 'day' || phase === 'night';
  const [player, setPlayer] = useState<Position>(PLAYER_START);
  const [objects, setObjects] = useState(WORLD_OBJECTS);
  const treeHits = useRef<Record<string, number>>({});
  const [treeAnimation, setTreeAnimation] = useState<{ id: string; falling: boolean }>();
  const crateHits = useRef<Record<string, number>>({});
  const [crateAnimation, setCrateAnimation] = useState<{ id: string; breaking: boolean }>();
  const [isSwinging, setIsSwinging] = useState(false);
  const [footprints, setFootprints] = useState<Footprint[]>([]);
  const footprintId = useRef(0);
  const spawnedDays = useRef(new Set<number>());
  const structureDays = useRef({ tent: 5 + Math.floor(Math.random() * 6), warehouse: 10 + Math.floor(Math.random() * 11) });
  const spawnedStructures = useRef(new Set<StructureKind>());
  const [structures, setStructures] = useState<WorldStructure[]>([]);
  useEffect(() => {
    if (day < 2 || phase !== 'day' || spawnedDays.current.has(day)) return;
    spawnedDays.current.add(day);
    const resources = createDailyResources(day, objects);
    if (resources.length) setObjects((current) => [...current, ...resources]);
  }, [day, phase]);
  useEffect(() => {
    if (phase !== 'day') return;
    const ready = (['tent', 'warehouse'] as const).filter((kind) => day >= structureDays.current[kind] && !spawnedStructures.current.has(kind));
    if (!ready.length) return;
    ready.forEach((kind) => {
      spawnedStructures.current.add(kind);
      const spawn = createStructure(kind, objects);
      setStructures((current) => [...current, spawn.structure]);
      setObjects((current) => [...current, spawn.marker, ...spawn.crates]);
    });
  }, [day, phase]);
  const updatePlayer = useCallback((position: Position) => setPlayer(position), []);
  const { zombies, hitZombie } = useZombieWave({ phase, day, player, onPlayerDamage, onBaseDamage, onCleared: onNightCleared });
  const swingAxe = useCallback(() => {
    setIsSwinging(true);
    window.setTimeout(() => setIsSwinging(false), 260);
  }, []);
  const addFootprint = useCallback((position: Position) => {
    const footprint = { ...position, id: footprintId.current++ };
    setFootprints((current) => [...current, footprint]);
    window.setTimeout(() => setFootprints((current) => current.filter((item) => item.id !== footprint.id)), 1000);
  }, []);
  const buildFenceAtSlot = useCallback((position: Position) => {
    const freeSlots = FENCE_SLOTS.filter((slot) => !fences.some((fence) => Math.hypot(fence.x - slot.x, fence.y - slot.y) < 8));
    const nearest = freeSlots.reduce<{ slot?: Position; distance: number }>((result, slot) => {
      const distance = Math.hypot(position.x - slot.x, position.y - slot.y);
      return distance < result.distance ? { slot, distance } : result;
    }, { distance: Number.POSITIVE_INFINITY });
    if (!nearest.slot || nearest.distance > 90) return onUnavailable();
    onBuildFence(nearest.slot);
  }, [fences, onBuildFence, onUnavailable]);
  const collectObject = useCallback((object: { id: string; kind: string }) => {
    if (object.kind === 'food' || object.kind === 'water') setObjects((current) => current.filter((item) => item.id !== object.id));
  }, []);
  const buildings = objects.filter((object) => object.kind === 'building');
  const trees = objects.filter((object) => object.kind === 'tree');
  const crates = objects.filter((object) => object.kind.startsWith('crate-'));
  const interactionObjects = objects.filter((object) => object.kind !== 'tree' && !object.kind.startsWith('crate-') && !object.kind.startsWith('structure-'));
  const harvestTree = useCallback((tree: { id: string }) => {
    if ((treeHits.current[tree.id] ?? 0) >= 3) return;
    onHarvest();
    playGameSound('chop');
    swingAxe();
    const hits = (treeHits.current[tree.id] ?? 0) + 1;
    treeHits.current[tree.id] = hits;
    const falling = hits >= 3;
    setTreeAnimation({ id: tree.id, falling });
    window.setTimeout(() => setTreeAnimation(undefined), falling ? 620 : 260);
    if (falling) window.setTimeout(() => setObjects((items) => items.filter((item) => item.id !== tree.id)), 600);
  }, [onHarvest, swingAxe]);
  const zombieTargets = zombies.map((zombie) => ({ id: zombie.id, kind: zombie.isBoss ? 'boss' : 'zombie', x: zombie.x, y: zombie.y }));
  const attackZombie = useCallback((target: { id: string }) => {
    swingAxe();
    hitZombie(target.id);
  }, [hitZombie, swingAxe]);
  const breakCrate = useCallback((crate: { id: string; kind: string }) => {
    if ((crateHits.current[crate.id] ?? 0) >= 3) return;
    swingAxe();
    playGameSound('chop');
    const hits = (crateHits.current[crate.id] ?? 0) + 1;
    crateHits.current[crate.id] = hits;
    const breaking = hits >= 3;
    setCrateAnimation({ id: crate.id, breaking });
    window.setTimeout(() => setCrateAnimation(undefined), breaking ? 520 : 240);
    if (!breaking) return;
    onCrateLoot(crate.kind as CrateKind);
    window.setTimeout(() => setObjects((items) => {
      const remaining = items.filter((item) => item.id !== crate.id);
      if (crate.kind !== 'crate-food') return remaining;
      const source = items.find((item) => item.id === crate.id);
      return source ? [...remaining, { id: `food-drop-${crate.id}`, kind: 'food', x: source.x, y: source.y + 9 }] : remaining;
    }), 480);
  }, [onCrateLoot, swingAxe]);
  const attackResource = useCallback((target: { id: string; kind: string }) => {
    if (target.kind === 'tree') harvestTree(target);
    else breakCrate(target);
  }, [breakCrate, harvestTree]);

  return (
    <><InteractionSystem enabled={canMove} player={player} objects={interactionObjects} handlers={handlers}
      onUnavailable={onUnavailable} onInteracted={collectObject} />
    <AttackSystem enabled={canMove} player={player} targets={phase === 'night' ? zombieTargets : [...trees, ...crates]}
      onHit={phase === 'night' ? attackZombie : attackResource} onMiss={onAttack} />
    <BuildSystem enabled={phase === 'day'} player={player} onBuild={buildFenceAtSlot} />
    {handlers.building && <RepairSystem enabled={canMove} player={player} buildings={buildings}
      onRepair={handlers.building} onUnavailable={onUnavailable} />}
    <GameCamera player={player}>
      <section className={`forest-map ${isNight ? 'forest-map--night' : ''}`} style={{ width: MAP_WIDTH, height: MAP_HEIGHT }} aria-label="Карта леса">
        <div className="sun">{isNight ? '☾' : '☀'}</div>
        {trees.map((tree) => <div className={`map-tree ${treeAnimation?.id === tree.id ? treeAnimation.falling ? 'map-tree--fall' : 'map-tree--hit' : ''}`}
          style={{ left: tree.x - 25, top: tree.y - 50 }} key={tree.id}>
          <span className="tree-shadow" /><span className="tree-trunk" />
          <span className="tree-crown tree-crown--left" /><span className="tree-crown tree-crown--right" />
          <span className="tree-crown tree-crown--top" /><span className="tree-highlight" />
        </div>)}
        <WorldStructures structures={structures} />
        {crates.map((crate) => <LootCrate crate={crate} animation={crateAnimation?.id === crate.id ? crateAnimation.breaking ? 'break' : 'hit' : undefined} key={crate.id} />)}
        {objects.filter((object) => object.kind === 'food').map((food) => <div className="map-food-drop" style={{ left: food.x - 11, top: food.y - 12 }} key={food.id}>🍗</div>)}
        <BaseStructure health={baseHealth} x={BASE_POSITION.x} y={BASE_POSITION.y} />
        {phase === 'day' && FENCE_SLOTS.filter((slot) => !fences.some((fence) => Math.hypot(fence.x - slot.x, fence.y - slot.y) < 8))
          .map((slot) => <span className="fence-slot" style={{ left: slot.x - 18, top: slot.y - 8, transform: `rotate(${fenceRotation(slot)}deg)` }} key={`${slot.x}-${slot.y}`} />)}
        {fences.map((fence) => <span className="map-fence" style={{ left: fence.x - 19, top: fence.y - 10, transform: `rotate(${fenceRotation(fence)}deg)` }} key={fence.id}>
          <i /><i /><i />
        </span>)}
        {footprints.map((footprint) => <span className="footprint" style={{ left: footprint.x + 8, top: footprint.y + 24 }} key={footprint.id} />)}
        <PlayerController nickname={playerNickname} canMove={canMove} onMove={updatePlayer} onFootstep={addFootprint} isAttacking={isSwinging} />
        {isNight && zombies.map((zombie) => <ZombieSprite zombie={zombie} key={zombie.id} />)}
        {isNight && <div className="night-overlay" />}
      </section>
    </GameCamera></>
  );
}
