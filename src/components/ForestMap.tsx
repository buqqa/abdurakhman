import { useCallback, useRef, useState } from 'react';
import { BASE_POSITION, MAP_HEIGHT, MAP_WIDTH, PLAYER_START } from '../game/mapConfig';
import { HARVEST_DISTANCE, type CrateKind, type InteractableObject, type InteractionHandlers } from '../game/interactions';
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
import { WaterBottle } from './WaterBottle';
import { Merchant } from './Merchant';
import { AXE_ATTACK_COOLDOWN, AXE_DAMAGE, DEFAULT_ATTACK_COOLDOWN, SPEAR_DAMAGE, SPEAR_RANGE_BONUS, WRENCH_ATTACK_COOLDOWN, WRENCH_DAMAGE } from '../game/config';
import { ChickenLeg } from './ChickenLeg';
import { SurvivalHud } from './SurvivalHud';
import { RemotePlayer } from './RemotePlayer';
import type { RemotePlayer as RemotePlayerState, SharedWorld, WorldHit, ZombieDeath } from '../game/multiplayer';
import type { Zombie } from '../game/zombies';
import type { SharedDrop } from '../game/multiplayer';
import { ReviveSystem } from '../game/systems/ReviveSystem';
import { useFootprints } from '../game/systems/useFootprints';
import { useTreeHarvest } from '../game/systems/useTreeHarvest';
import { useCrateHarvest } from '../game/systems/useCrateHarvest';
import { useWorldState } from '../game/systems/useWorldState';
import { WeaponItem } from './WeaponItem';

interface Props { paused: boolean; mobileMode: boolean; multiplayerMode: boolean; localPlayerId: string; playerNickname: string; phase: Phase; day: number; difficulty: string; baseHealth: number; maxNights: number; playerHealth: number; weapon: Weapon; hasSpear: boolean; hasAxe: boolean; merchantDay: number; wood: number; onBuySpear: () => void; onBuyAxe: () => void; handlers: InteractionHandlers; onUnavailable: () => void; onAttack: () => void; onHarvest: () => void; onCrateLoot: (kind: CrateKind) => void; onCrateClaim: (kind: CrateKind, playerId: string) => void; onPlayerDamage: (damage: number) => void; onBaseDamage: (damage: number) => void; onNightCleared: () => void; remotePlayers: RemotePlayerState[]; onPlayerMove: (position: Position) => void; onRevivePlayer: (id: string) => void; onPlayerAttack: () => void; onWorldHit: (object: import('../game/interactions').InteractableObject, hitsToBreak: number) => void; worldHits: WorldHit[]; sharedWorld?: SharedWorld; worldTakes: { id: string; nonce: string }[]; onWorldState: (world: SharedWorld) => void; onWorldTake: (id: string) => void; zombieDeath?: ZombieDeath; onZombieDeath: (zombie: Zombie) => void; onRemotePlayerDamage: (id: string, damage: number) => void; authoritative: boolean; sharedZombies: Zombie[]; zombieHit?: { sequence: number; totals: Record<string, number> }; onZombiesChange: (zombies: Zombie[]) => void; onZombieHit: (id: string, damage: number) => void; sharedDrops: SharedDrop[]; onTakeDrop: (drop: SharedDrop) => void }

export function ForestMap({ paused, mobileMode, multiplayerMode, localPlayerId, playerNickname, phase, day, difficulty, baseHealth, maxNights, playerHealth, weapon, hasSpear, hasAxe, merchantDay, wood, onBuySpear, onBuyAxe, handlers, onUnavailable, onAttack, onHarvest, onCrateLoot, onCrateClaim, onPlayerDamage, onBaseDamage, onNightCleared, remotePlayers, onPlayerMove, onRevivePlayer, onPlayerAttack, onWorldHit, worldHits, sharedWorld, worldTakes, onWorldState, onWorldTake, zombieDeath, onZombieDeath, onRemotePlayerDamage, authoritative, sharedZombies, zombieHit, onZombiesChange, onZombieHit, sharedDrops, onTakeDrop }: Props) {
  const isNight = phase === 'night';
  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const merchantVisible = (phase === 'day' || phase === 'night') && day === merchantDay && (!hasSpear || !hasAxe);
  const worldReady = authoritative || Boolean(sharedWorld);
  const canMove = worldReady && playerHealth > 0 && !paused && !isTradeOpen && (phase === 'day' || phase === 'night');
  const [player, setPlayer] = useState<Position>(PLAYER_START);
  const lastMapFrame = useRef(0);
  const [isSwinging, setIsSwinging] = useState(false);
  const { objects, setObjects, structures } = useWorldState({ authoritative, day, maxNights, phase, sharedWorld, worldTakes, onWorldState });
  const updatePlayer = useCallback((position: Position) => {
    onPlayerMove(position);
    const now = performance.now();
    if (now - lastMapFrame.current < 32) return;
    lastMapFrame.current = now;
    setPlayer(position);
  }, [onPlayerMove]);
  const car = structures.find((structure) => structure.kind === 'car');
  const carGuardPoint = car?.spawnedDay === day ? { x: car.x + 77, y: car.y + 39 } : undefined;
  const { zombies, deaths, explosions, hitZombie } = useZombieWave({ phase, day, difficulty, player, playerHealth, teammates: remotePlayers, paused, onPlayerDamage, onRemotePlayerDamage, onBaseDamage, onCleared: onNightCleared, authoritative, externalZombies: sharedZombies, remoteHit: zombieHit, remoteDeath: zombieDeath, onZombiesChange, onRemoteHit: onZombieHit, onZombieDeath, carGuardPoint });
  const swingWeapon = useCallback(() => {
    setIsSwinging(true);
    onPlayerAttack();
    window.setTimeout(() => setIsSwinging(false), 260);
  }, [onPlayerAttack]);
  const { footprints, addFootprint } = useFootprints(remotePlayers);
  const collectObject = useCallback((object: { id: string; kind: string }) => {
    if (object.kind === 'food' || object.kind === 'water' || object.kind === 'wrench') {
      if (multiplayerMode) return onWorldTake(object.id);
      setObjects((current) => current.filter((item) => item.id !== object.id));
    }
  }, [multiplayerMode, onWorldTake]);
  const buildings = objects.filter((object) => object.kind === 'building');
  const trees = objects.filter((object) => object.kind === 'tree');
  const crates = objects.filter((object) => object.kind.startsWith('crate-'));
  const interactionObjects = objects.filter((object) => object.kind !== 'tree' && !object.kind.startsWith('crate-') && !object.kind.startsWith('structure-'));
  const sharedDropObjects = sharedDrops.map((drop) => ({ ...drop, kind: 'shared-drop' }));
  const sharedHandlers = { ...handlers,
    ...(multiplayerMode ? { food: () => undefined, water: () => undefined, wrench: () => undefined } : {}),
    'shared-drop': (object: { id: string }) => { const drop = sharedDrops.find((item) => item.id === object.id); if (drop) onTakeDrop(drop); },
  };
  const { treeAnimation, harvestTree } = useTreeHarvest({ weapon, worldHits, setObjects, onHarvest, onSwing: swingWeapon, onWorldHit });
  const { crateAnimation, breakCrate } = useCrateHarvest({ worldHits, setObjects, onLoot: onCrateLoot, onSwing: swingWeapon, onWorldHit, authoritative, localPlayerId, multiplayerMode, onCrateClaim });
  const zombieTargets = zombies.map((zombie) => ({ id: zombie.id, kind: 'zombie', x: zombie.x, y: zombie.y }));
  const attackZombie = useCallback((target: { id: string }) => {
    swingWeapon();
    playGameSound('chop');
    hitZombie(target.id, weapon === 'wrench' ? WRENCH_DAMAGE : weapon === 'spear' ? SPEAR_DAMAGE : weapon === 'axe' ? AXE_DAMAGE : 1);
  }, [hitZombie, swingWeapon, weapon]);
  const attackResource = useCallback((target: InteractableObject) => {
    if (target.kind === 'tree') harvestTree(target);
    else breakCrate(target);
  }, [breakCrate, harvestTree]);
  const attackTarget = useCallback((target: InteractableObject) => {
    if (target.kind === 'zombie') attackZombie(target);
    else attackResource(target);
  }, [attackResource, attackZombie]);

  return (
    <><InteractionSystem enabled={canMove} player={player} objects={[...interactionObjects, ...sharedDropObjects]} handlers={sharedHandlers}
      onUnavailable={onUnavailable} onInteracted={collectObject} />
    <ReviveSystem enabled={canMove} player={player} teammates={remotePlayers} onRevive={onRevivePlayer} />
    <AttackSystem enabled={canMove} player={player} targets={[...(isNight ? zombieTargets : []), ...trees, ...crates]}
      attackDistance={weapon === 'spear' ? HARVEST_DISTANCE * SPEAR_RANGE_BONUS : HARVEST_DISTANCE}
      cooldown={weapon === 'wrench' ? WRENCH_ATTACK_COOLDOWN : weapon === 'axe' ? AXE_ATTACK_COOLDOWN : DEFAULT_ATTACK_COOLDOWN}
      onHit={attackTarget} onMiss={onAttack} />
    {handlers.building && <RepairSystem enabled={canMove} player={player} buildings={buildings}
      onRepair={handlers.building} onUnavailable={onUnavailable} />}
    <GameCamera player={player} lookAheadY={mobileMode ? 95 : 0} overlay={<SurvivalHud phase={phase} day={day} baseHealth={baseHealth} playerHealth={playerHealth} />}>
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
        {objects.filter((object) => object.kind === 'wrench').map((wrench) => <WeaponItem kind="wrench" className="map-weapon-drop" style={{ left: wrench.x - 8, top: wrench.y - 15 }} key={wrench.id} />)}
        {sharedDrops.map((drop) => <span className={`shared-drop shared-drop--${drop.kind}`} style={{ left: drop.x, top: drop.y }} key={drop.id}>
          {drop.kind === 'wood' ? '🪵' : drop.kind === 'food' ? <ChickenLeg /> : drop.kind === 'water' ? <WaterBottle className="shared-drop__water" /> : <WeaponItem kind={drop.kind} />}
        </span>)}
        <BaseStructure health={baseHealth} x={BASE_POSITION.x} y={BASE_POSITION.y} mobileRepair={mobileMode} />
        {footprints.map((footprint) => <span className="footprint" style={{ left: footprint.x + 8, top: footprint.y + 24 }} key={footprint.id} />)}
        {merchantVisible && <Merchant player={player} wood={wood} hasSpear={hasSpear} hasAxe={hasAxe} isOpen={isTradeOpen} onOpen={() => setIsTradeOpen(true)} onClose={() => setIsTradeOpen(false)} onBuySpear={onBuySpear} onBuyAxe={onBuyAxe} />}
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
