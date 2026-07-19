import { useCallback, useEffect, useRef, useState } from 'react';
import { BASE_POSITION, MAP_HEIGHT, MAP_WIDTH, PLAYER_START } from '../game/mapConfig';
import { createDailyResources, HARVEST_DISTANCE, WORLD_OBJECTS, type CrateKind, type InteractableObject, type InteractionHandlers } from '../game/interactions';
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
import { ZombieExplosion } from './ZombieExplosion';
import { LootCrate } from './LootCrate';
import { WorldStructures } from './WorldStructures';
import { createStructure, type StructureKind, type WorldStructure } from '../game/structures';
import { WaterBottle } from './WaterBottle';
import { Merchant } from './Merchant';
import { SPEAR_DAMAGE, SPEAR_RANGE_BONUS } from '../game/config';
import { ChickenLeg } from './ChickenLeg';
import { MobileGameHud } from './MobileGameHud';
import { RemotePlayer } from './RemotePlayer';
import type { RemotePlayer as RemotePlayerState, SharedWorld, WorldHit, ZombieDeath } from '../game/multiplayer';
import type { Zombie } from '../game/zombies';
import type { SharedDrop } from '../game/multiplayer';
import { ReviveSystem } from '../game/systems/ReviveSystem';
import { useFootprints } from '../game/systems/useFootprints';
import { useTreeHarvest } from '../game/systems/useTreeHarvest';
import { useCrateHarvest } from '../game/systems/useCrateHarvest';

interface Props { paused: boolean; mobileMode: boolean; playerNickname: string; phase: Phase; day: number; difficulty: string; baseHealth: number; maxNights: number; playerHealth: number; weapon: Weapon; hasSpear: boolean; merchantDay: number; wood: number; onBuySpear: () => void; handlers: InteractionHandlers; onUnavailable: () => void; onAttack: () => void; onHarvest: () => void; onCrateLoot: (kind: CrateKind) => void; onPlayerDamage: (damage: number) => void; onBaseDamage: (damage: number) => void; onNightCleared: () => void; remotePlayers: RemotePlayerState[]; onPlayerMove: (position: Position) => void; onRevivePlayer: (id: string) => void; onPlayerAttack: () => void; onWorldHit: (object: import('../game/interactions').InteractableObject, hitsToBreak: number) => void; worldHit?: WorldHit; sharedWorld?: SharedWorld; worldTake?: { id: string; nonce: string }; onWorldState: (world: SharedWorld) => void; onWorldTake: (id: string) => void; zombieDeath?: ZombieDeath; onZombieDeath: (zombie: Zombie) => void; onRemotePlayerDamage: (id: string, damage: number) => void; authoritative: boolean; sharedZombies: Zombie[]; zombieHit?: { id: string; damage: number; nonce: string }; onZombiesChange: (zombies: Zombie[]) => void; onZombieHit: (id: string, damage: number) => void; sharedDrops: SharedDrop[]; onTakeDrop: (drop: SharedDrop) => void }

export function ForestMap({ paused, mobileMode, playerNickname, phase, day, difficulty, baseHealth, maxNights, playerHealth, weapon, hasSpear, merchantDay, wood, onBuySpear, handlers, onUnavailable, onAttack, onHarvest, onCrateLoot, onPlayerDamage, onBaseDamage, onNightCleared, remotePlayers, onPlayerMove, onRevivePlayer, onPlayerAttack, onWorldHit, worldHit, sharedWorld, worldTake, onWorldState, onWorldTake, zombieDeath, onZombieDeath, onRemotePlayerDamage, authoritative, sharedZombies, zombieHit, onZombiesChange, onZombieHit, sharedDrops, onTakeDrop }: Props) {
  const isNight = phase === 'night';
  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const merchantVisible = phase === 'day' && day === merchantDay && !hasSpear;
  const worldReady = authoritative || Boolean(sharedWorld);
  const canMove = worldReady && playerHealth > 0 && !paused && !isTradeOpen && (phase === 'day' || phase === 'night');
  const [player, setPlayer] = useState<Position>(PLAYER_START);
  const [objects, setObjects] = useState(WORLD_OBJECTS);
  const [isSwinging, setIsSwinging] = useState(false);
  const spawnedDays = useRef(new Set<number>());
  const structureDays = useRef({ tent: 5 + Math.floor(Math.random() * 6), warehouse: 10 + Math.floor(Math.random() * 11) });
  const spawnedStructures = useRef(new Set<StructureKind>());
  const [structures, setStructures] = useState<WorldStructure[]>([]);
  useEffect(() => {
    if (authoritative) onWorldState({ objects, structures });
  }, [authoritative, objects, onWorldState, structures]);
  useEffect(() => {
    if (authoritative || !sharedWorld) return;
    setObjects(sharedWorld.objects);
    setStructures(sharedWorld.structures);
  }, [authoritative, sharedWorld]);
  useEffect(() => {
    if (worldTake) setObjects((current) => current.filter((item) => item.id !== worldTake.id));
  }, [worldTake?.nonce]);
  useEffect(() => {
    if (!authoritative || day < 2 || phase !== 'day' || spawnedDays.current.has(day)) return;
    spawnedDays.current.add(day);
    const resources = createDailyResources(day, objects);
    if (resources.length) setObjects((current) => [...current, ...resources]);
  }, [authoritative, day, phase]);
  useEffect(() => {
    if (!authoritative || phase !== 'day') return;
    const expiredIds = structures.filter((structure) => structure.spawnedDay < day).map((structure) => structure.id);
    if (!expiredIds.length) return;
    setStructures((current) => current.filter((structure) => !expiredIds.includes(structure.id)));
    setObjects((current) => current.filter((object) => !expiredIds.some((id) => object.id.startsWith(`${id}-`))));
  }, [authoritative, day, phase, structures]);
  useEffect(() => {
    if (!authoritative || phase !== 'day') return;
    const ready = (['tent', 'warehouse'] as const).filter((kind) => day >= structureDays.current[kind] && !spawnedStructures.current.has(kind));
    if (!ready.length) return;
    ready.forEach((kind) => {
      spawnedStructures.current.add(kind);
      const spawn = createStructure(kind, objects, day);
      setStructures((current) => [...current, spawn.structure]);
      setObjects((current) => [...current, spawn.marker, ...spawn.crates]);
    });
  }, [authoritative, day, phase]);
  const updatePlayer = useCallback((position: Position) => { setPlayer(position); onPlayerMove(position); }, [onPlayerMove]);
  const { zombies, deaths, explosions, hitZombie } = useZombieWave({ phase, day, difficulty, player, playerHealth, teammates: remotePlayers, paused, onPlayerDamage, onRemotePlayerDamage, onBaseDamage, onCleared: onNightCleared, authoritative, externalZombies: sharedZombies, remoteHit: zombieHit, remoteDeath: zombieDeath, onZombiesChange, onRemoteHit: onZombieHit, onZombieDeath });
  const swingWeapon = useCallback(() => {
    setIsSwinging(true);
    onPlayerAttack();
    window.setTimeout(() => setIsSwinging(false), 260);
  }, [onPlayerAttack]);
  const { footprints, addFootprint } = useFootprints(remotePlayers);
  const collectObject = useCallback((object: { id: string; kind: string }) => {
    if (object.kind === 'food' || object.kind === 'water') {
      setObjects((current) => current.filter((item) => item.id !== object.id));
      onWorldTake(object.id);
    }
  }, [onWorldTake]);
  const buildings = objects.filter((object) => object.kind === 'building');
  const trees = objects.filter((object) => object.kind === 'tree');
  const crates = objects.filter((object) => object.kind.startsWith('crate-'));
  const interactionObjects = objects.filter((object) => object.kind !== 'tree' && !object.kind.startsWith('crate-') && !object.kind.startsWith('structure-'));
  const sharedDropObjects = sharedDrops.map((drop) => ({ ...drop, kind: 'shared-drop' }));
  const sharedHandlers = { ...handlers, 'shared-drop': (object: { id: string }) => { const drop = sharedDrops.find((item) => item.id === object.id); if (drop) onTakeDrop(drop); } };
  const { treeAnimation, harvestTree } = useTreeHarvest({ weapon, worldHit, setObjects, onHarvest, onSwing: swingWeapon, onWorldHit });
  const { crateAnimation, breakCrate } = useCrateHarvest({ worldHit, setObjects, onLoot: onCrateLoot, onSwing: swingWeapon, onWorldHit });
  const zombieTargets = zombies.map((zombie) => ({ id: zombie.id, kind: 'zombie', x: zombie.x, y: zombie.y }));
  const attackZombie = useCallback((target: { id: string }) => {
    swingWeapon();
    playGameSound('chop');
    hitZombie(target.id, weapon === 'spear' ? SPEAR_DAMAGE : 1);
  }, [hitZombie, swingWeapon, weapon]);
  const attackResource = useCallback((target: InteractableObject) => {
    if (target.kind === 'tree') harvestTree(target);
    else breakCrate(target);
  }, [breakCrate, harvestTree]);

  return (
    <><InteractionSystem enabled={canMove} player={player} objects={[...interactionObjects, ...sharedDropObjects]} handlers={sharedHandlers}
      onUnavailable={onUnavailable} onInteracted={collectObject} />
    <ReviveSystem enabled={canMove} player={player} teammates={remotePlayers} onRevive={onRevivePlayer} />
    <AttackSystem enabled={canMove} player={player} targets={phase === 'night' ? zombieTargets : [...trees, ...crates]}
      attackDistance={weapon === 'spear' ? HARVEST_DISTANCE * SPEAR_RANGE_BONUS : HARVEST_DISTANCE}
      cooldown={450}
      onHit={phase === 'night' ? attackZombie : attackResource} onMiss={onAttack} />
    {handlers.building && <RepairSystem enabled={canMove} player={player} buildings={buildings}
      onRepair={handlers.building} onUnavailable={onUnavailable} />}
    <GameCamera player={player} lookAheadY={mobileMode ? 95 : 0} overlay={mobileMode ? <MobileGameHud phase={phase} day={day} maxNights={maxNights} baseHealth={baseHealth} playerHealth={playerHealth} /> : undefined}>
      <section className={`forest-map ${isNight ? 'forest-map--night' : ''} ${paused ? 'forest-map--paused' : ''}`} style={{ width: MAP_WIDTH, height: MAP_HEIGHT }} aria-label="Карта леса">
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
        {sharedDrops.map((drop) => <span className={`shared-drop shared-drop--${drop.kind}`} style={{ left: drop.x, top: drop.y }} key={drop.id}>{drop.kind === 'wood' ? '🪵' : drop.kind === 'food' ? '🍗' : '💧'}</span>)}
        <BaseStructure health={baseHealth} x={BASE_POSITION.x} y={BASE_POSITION.y} mobileRepair={mobileMode} />
        {footprints.map((footprint) => <span className="footprint" style={{ left: footprint.x + 8, top: footprint.y + 24 }} key={footprint.id} />)}
        {merchantVisible && <Merchant player={player} wood={wood} isOpen={isTradeOpen} onOpen={() => setIsTradeOpen(true)} onClose={() => setIsTradeOpen(false)} onBuy={onBuySpear} />}
        <PlayerController nickname={playerNickname} canMove={canMove} onMove={updatePlayer} onFootstep={addFootprint} isAttacking={isSwinging} downed={playerHealth <= 0} weapon={weapon} />
        {remotePlayers.map((remote) => <RemotePlayer player={remote} key={remote.id} />)}
        {isNight && zombies.map((zombie) => <ZombieSprite zombie={zombie} key={zombie.id} />)}
        {isNight && deaths.map((zombie) => <ZombieSprite zombie={zombie} dying key={`death-${zombie.id}`} />)}
        {isNight && explosions.map((explosion) => <ZombieExplosion explosion={explosion} key={explosion.id} />)}
        {isNight && <div className="night-overlay" />}
      </section>
    </GameCamera></>
  );
}
