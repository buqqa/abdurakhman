import type { MerchantVisit, Phase } from '../game/types';
import { ForestMap } from './ForestMap';
import type { InteractableObject, InteractionHandlers } from '../game/interactions';
import type { Weapon } from '../game/types';
import type { CrateKind } from '../game/interactions';
import type { RemotePlayer, SharedWorld, WorldHit, ZombieDeath } from '../game/multiplayer';
import type { Position } from './PlayerController';
import type { Zombie } from '../game/zombies';
import type { SharedDrop } from '../game/multiplayer';

interface Props {
  paused: boolean;
  mobileMode: boolean;
  playerNickname: string;
  phase: Phase;
  day: number;
  difficulty: string;
  baseHealth: number;
  maxNights: number;
  playerHealth: number;
  weapon: Weapon;
  hasSpear: boolean;
  hasAxe: boolean;
  hasSword: boolean;
  merchantVisits: MerchantVisit[];
  wood: number;
  onBuySpear: () => void;
  onBuyAxe: () => void;
  onBuySword: () => void;
  interactionHandlers: InteractionHandlers;
  onUnavailable: () => void;
  onAttack: () => void;
  onHarvest: () => void;
  onCrateLoot: (kind: CrateKind) => void;
  onPlayerDamage: (damage: number) => void;
  onBaseDamage: (damage: number) => void;
  onNightCleared: () => void;
  remotePlayers: RemotePlayer[];
  onPlayerMove: (position: Position) => void;
  onRevivePlayer: (id: string) => void;
  onPlayerAttack: () => void;
  onWorldHit: (object: InteractableObject, hitsToBreak: number) => void;
  worldHits: WorldHit[];
  sharedWorld?: SharedWorld; worldTakes: { id: string; nonce: string }[]; onWorldState: (world: SharedWorld) => void; onWorldTake: (id: string) => void;
  zombieDeath?: ZombieDeath;
  onZombieDeath: (zombie: Zombie) => void;
  onRemotePlayerDamage: (id: string, damage: number) => void;
  multiplayerMode: boolean;
  localPlayerId: string;
  onCrateClaim: (kind: CrateKind, playerId: string) => void;
  authoritative: boolean; sharedZombies: Zombie[]; zombieHit?: { sequence: number; totals: Record<string, number> }; onZombiesChange: (zombies: Zombie[]) => void; onZombieHit: (id: string, damage: number) => void;
  sharedDrops: SharedDrop[]; onTakeDrop: (drop: SharedDrop) => void;
}

export function GameWorld({ paused, mobileMode, playerNickname, phase, day, difficulty, baseHealth, maxNights, playerHealth, weapon, hasSpear, hasAxe, hasSword, merchantVisits, wood, onBuySpear, onBuyAxe, onBuySword, interactionHandlers, onUnavailable, onAttack, onHarvest, onCrateLoot, onPlayerDamage, onBaseDamage, onNightCleared, remotePlayers, onPlayerMove, onRevivePlayer, onPlayerAttack, onWorldHit, worldHits, sharedWorld, worldTakes, onWorldState, onWorldTake, zombieDeath, onZombieDeath, onRemotePlayerDamage, multiplayerMode, localPlayerId, onCrateClaim, authoritative, sharedZombies, zombieHit, onZombiesChange, onZombieHit, sharedDrops, onTakeDrop }: Props) {
  return (
    <section className="game-world">
      <ForestMap paused={paused} mobileMode={mobileMode} multiplayerMode={multiplayerMode} localPlayerId={localPlayerId} playerNickname={playerNickname} phase={phase} day={day} difficulty={difficulty} baseHealth={baseHealth} maxNights={maxNights} playerHealth={playerHealth} weapon={weapon} hasSpear={hasSpear} hasAxe={hasAxe} hasSword={hasSword} merchantVisits={merchantVisits} wood={wood} onBuySpear={onBuySpear} onBuyAxe={onBuyAxe} onBuySword={onBuySword} handlers={interactionHandlers} onUnavailable={onUnavailable}
        remotePlayers={remotePlayers} onPlayerMove={onPlayerMove} onRevivePlayer={onRevivePlayer} onPlayerAttack={onPlayerAttack} onWorldHit={onWorldHit} worldHits={worldHits}
        sharedWorld={sharedWorld} worldTakes={worldTakes} onWorldState={onWorldState} onWorldTake={onWorldTake}
        zombieDeath={zombieDeath} onZombieDeath={onZombieDeath}
        onRemotePlayerDamage={onRemotePlayerDamage}
        authoritative={authoritative} sharedZombies={sharedZombies} zombieHit={zombieHit} onZombiesChange={onZombiesChange} onZombieHit={onZombieHit}
        sharedDrops={sharedDrops} onTakeDrop={onTakeDrop}
        onAttack={onAttack} onHarvest={onHarvest} onCrateLoot={onCrateLoot} onCrateClaim={onCrateClaim} onPlayerDamage={onPlayerDamage}
        onBaseDamage={onBaseDamage} onNightCleared={onNightCleared} />
    </section>
  );
}
