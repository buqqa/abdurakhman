import type { Phase } from '../game/types';
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
  merchantDay: number;
  wood: number;
  onBuySpear: () => void;
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
  worldHit?: WorldHit;
  sharedWorld?: SharedWorld; worldTake?: { id: string; nonce: string }; onWorldState: (world: SharedWorld) => void; onWorldTake: (id: string) => void;
  zombieDeath?: ZombieDeath;
  onZombieDeath: (zombie: Zombie) => void;
  onRemotePlayerDamage: (id: string, damage: number) => void;
  multiplayerMode: boolean;
  authoritative: boolean; sharedZombies: Zombie[]; zombieHit?: { id: string; damage: number; nonce: string }; onZombiesChange: (zombies: Zombie[]) => void; onZombieHit: (id: string, damage: number) => void;
  sharedDrops: SharedDrop[]; onTakeDrop: (drop: SharedDrop) => void;
}

export function GameWorld({ paused, mobileMode, playerNickname, phase, day, difficulty, baseHealth, maxNights, playerHealth, weapon, hasSpear, merchantDay, wood, onBuySpear, interactionHandlers, onUnavailable, onAttack, onHarvest, onCrateLoot, onPlayerDamage, onBaseDamage, onNightCleared, remotePlayers, onPlayerMove, onRevivePlayer, onPlayerAttack, onWorldHit, worldHit, sharedWorld, worldTake, onWorldState, onWorldTake, zombieDeath, onZombieDeath, onRemotePlayerDamage, multiplayerMode, authoritative, sharedZombies, zombieHit, onZombiesChange, onZombieHit, sharedDrops, onTakeDrop }: Props) {
  return (
    <section>
      <ForestMap paused={paused} mobileMode={mobileMode} multiplayerMode={multiplayerMode} playerNickname={playerNickname} phase={phase} day={day} difficulty={difficulty} baseHealth={baseHealth} maxNights={maxNights} playerHealth={playerHealth} weapon={weapon} hasSpear={hasSpear} merchantDay={merchantDay} wood={wood} onBuySpear={onBuySpear} handlers={interactionHandlers} onUnavailable={onUnavailable}
        remotePlayers={remotePlayers} onPlayerMove={onPlayerMove} onRevivePlayer={onRevivePlayer} onPlayerAttack={onPlayerAttack} onWorldHit={onWorldHit} worldHit={worldHit}
        sharedWorld={sharedWorld} worldTake={worldTake} onWorldState={onWorldState} onWorldTake={onWorldTake}
        zombieDeath={zombieDeath} onZombieDeath={onZombieDeath}
        onRemotePlayerDamage={onRemotePlayerDamage}
        authoritative={authoritative} sharedZombies={sharedZombies} zombieHit={zombieHit} onZombiesChange={onZombiesChange} onZombieHit={onZombieHit}
        sharedDrops={sharedDrops} onTakeDrop={onTakeDrop}
        onAttack={onAttack} onHarvest={onHarvest} onCrateLoot={onCrateLoot} onPlayerDamage={onPlayerDamage}
        onBaseDamage={onBaseDamage} onNightCleared={onNightCleared} />
    </section>
  );
}
