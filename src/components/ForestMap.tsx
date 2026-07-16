import { useCallback, useEffect, useRef, useState } from 'react';
import { BASE_POSITION, MAP_HEIGHT, MAP_WIDTH, PLAYER_START } from '../game/mapConfig';
import { createDailyResources, HARVEST_DISTANCE, WORLD_OBJECTS, type CrateKind, type InteractionHandlers } from '../game/interactions';
import { InteractionSystem } from '../game/systems/InteractionSystem';
import { RepairSystem } from '../game/systems/RepairSystem';
import { AttackSystem } from '../game/systems/AttackSystem';
import type { Phase, Weapon } from '../game/types';
import { GameCamera } from './GameCamera';
import { PlayerController, type Position } from './PlayerController';
import { BaseStructure } from './BaseStructure';
import { playGameSound } from '../lib/gameAudio';
import { useZombieWave } from '../game/systems/useZombieWave';
import { ZombieSprite } from './ZombieSprite';
import { LootCrate } from './LootCrate';
import { WorldStructures } from './WorldStructures';
import { createStructure, type StructureKind, type WorldStructure } from '../game/structures';
import { WaterBottle } from './WaterBottle';
import { Merchant } from './Merchant';
import { SPEAR_BONUS } from '../game/config';
import { ChickenLeg } from './ChickenLeg';

interface Footprint extends Position { id: number }

interface Props { paused: boolean; mobileMode: boolean; playerNickname: string; phase: Phase; day: number; difficulty: string; baseHealth: number; weapon: Weapon; hasSpear: boolean; merchantDay: number; wood: number; onBuySpear: () => void; handlers: InteractionHandlers; onUnavailable: () => void; onAttack: () => void; onHarvest: () => void; onCrateLoot: (kind: CrateKind) => void; onPlayerDamage: (damage: number) => void; onBaseDamage: (damage: number) => void; onNightCleared: () => void }

export function ForestMap({ paused, mobileMode, playerNickname, phase, day, difficulty, baseHealth, weapon, hasSpear, merchantDay, wood, onBuySpear, handlers, onUnavailable, onAttack, onHarvest, onCrateLoot, onPlayerDamage, onBaseDamage, onNightCleared }: Props) {
  const isNight = phase === 'night';
  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const merchantVisible = phase === 'day' && day === merchantDay && !hasSpear;
  const canMove = !paused && !isTradeOpen && (phase === 'day' || phase === 'night');
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
  const { zombies, hitZombie } = useZombieWave({ phase, day, difficulty, player, paused, onPlayerDamage, onBaseDamage, onCleared: onNightCleared });
  const swingWeapon = useCallback(() => {
    setIsSwinging(true);
    window.setTimeout(() => setIsSwinging(false), 260);
  }, []);
  const addFootprint = useCallback((position: Position) => {
    const footprint = { ...position, id: footprintId.current++ };
    setFootprints((current) => [...current, footprint]);
    window.setTimeout(() => setFootprints((current) => current.filter((item) => item.id !== footprint.id)), 1000);
  }, []);
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
    swingWeapon();
    const hits = (treeHits.current[tree.id] ?? 0) + 1;
    treeHits.current[tree.id] = hits;
    const falling = hits >= 3;
    setTreeAnimation({ id: tree.id, falling });
    window.setTimeout(() => setTreeAnimation(undefined), falling ? 620 : 260);
    if (falling) window.setTimeout(() => setObjects((items) => items.filter((item) => item.id !== tree.id)), 600);
  }, [onHarvest, swingWeapon]);
  const zombieTargets = zombies.map((zombie) => ({ id: zombie.id, kind: 'zombie', x: zombie.x, y: zombie.y }));
  const attackZombie = useCallback((target: { id: string }) => {
    swingWeapon();
    playGameSound('chop');
    hitZombie(target.id, weapon === 'spear' ? SPEAR_BONUS : 1);
  }, [hitZombie, swingWeapon, weapon]);
  const breakCrate = useCallback((crate: { id: string; kind: string }) => {
    if ((crateHits.current[crate.id] ?? 0) >= 3) return;
    swingWeapon();
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
      if (!source) return remaining;
      const drops = [{ id: `food-drop-${crate.id}`, kind: 'food', x: source.x - 8, y: source.y + 9 }];
      const isTentCrate = crate.id.startsWith('structure-tent-crate-');
      const dropsWater = isTentCrate ? crate.id.endsWith('-0') : Math.random() < .15;
      if (dropsWater) drops.push({ id: `water-drop-${crate.id}`, kind: 'water', x: source.x + 17, y: source.y + 9 });
      return [...remaining, ...drops];
    }), 480);
  }, [onCrateLoot, swingWeapon]);
  const attackResource = useCallback((target: { id: string; kind: string }) => {
    if (target.kind === 'tree') harvestTree(target);
    else breakCrate(target);
  }, [breakCrate, harvestTree]);

  return (
    <><InteractionSystem enabled={canMove} player={player} objects={interactionObjects} handlers={handlers}
      onUnavailable={onUnavailable} onInteracted={collectObject} />
    <AttackSystem enabled={canMove} player={player} targets={phase === 'night' ? zombieTargets : [...trees, ...crates]}
      attackDistance={weapon === 'spear' ? HARVEST_DISTANCE * SPEAR_BONUS : HARVEST_DISTANCE}
      cooldown={phase === 'day' && weapon === 'spear' ? 450 * SPEAR_BONUS : 450}
      onHit={phase === 'night' ? attackZombie : attackResource} onMiss={onAttack} />
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
        {objects.filter((object) => object.kind === 'food').map((food) => <ChickenLeg className="map-food-drop" style={{ left: food.x - 11, top: food.y - 12 }} key={food.id} />)}
        {objects.filter((object) => object.kind === 'water').map((water) => <WaterBottle className="map-water-bottle" key={water.id}
          style={{ left: water.x - 8, top: water.y - 14 }} />)}
        <BaseStructure health={baseHealth} x={BASE_POSITION.x} y={BASE_POSITION.y} mobileRepair={mobileMode} />
        {footprints.map((footprint) => <span className="footprint" style={{ left: footprint.x + 8, top: footprint.y + 24 }} key={footprint.id} />)}
        {merchantVisible && <Merchant player={player} wood={wood} isOpen={isTradeOpen} onOpen={() => setIsTradeOpen(true)} onClose={() => setIsTradeOpen(false)} onBuy={onBuySpear} />}
        <PlayerController nickname={playerNickname} canMove={canMove} onMove={updatePlayer} onFootstep={addFootprint} isAttacking={isSwinging} weapon={weapon} />
        {isNight && zombies.map((zombie) => <ZombieSprite zombie={zombie} key={zombie.id} />)}
        {isNight && <div className="night-overlay" />}
      </section>
    </GameCamera></>
  );
}
