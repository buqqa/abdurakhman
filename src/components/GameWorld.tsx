import type { Phase } from '../game/types';
import { ForestMap } from './ForestMap';
import type { InteractionHandlers } from '../game/interactions';
import type { Weapon } from '../game/types';
import type { CrateKind } from '../game/interactions';
import { useI18n } from '../i18n/I18nContext';
import type { RemotePlayer, WorldHit } from '../game/multiplayer';
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
  onWorldHit: (id: string, hitsToFell: number) => void;
  worldHit?: WorldHit;
  authoritative: boolean; sharedZombies: Zombie[]; zombieHit?: { id: string; damage: number; nonce: string }; onZombiesChange: (zombies: Zombie[]) => void; onZombieHit: (id: string, damage: number) => void;
  sharedDrops: SharedDrop[]; onTakeDrop: (drop: SharedDrop) => void;
}

export function GameWorld({ paused, mobileMode, playerNickname, phase, day, difficulty, baseHealth, maxNights, playerHealth, weapon, hasSpear, merchantDay, wood, onBuySpear, interactionHandlers, onUnavailable, onAttack, onHarvest, onCrateLoot, onPlayerDamage, onBaseDamage, onNightCleared, remotePlayers, onPlayerMove, onRevivePlayer, onPlayerAttack, onWorldHit, worldHit, authoritative, sharedZombies, zombieHit, onZombiesChange, onZombieHit, sharedDrops, onTakeDrop }: Props) {
  const { t, language } = useI18n();
  return (
    <section>
      <ForestMap paused={paused} mobileMode={mobileMode} playerNickname={playerNickname} phase={phase} day={day} difficulty={difficulty} baseHealth={baseHealth} maxNights={maxNights} playerHealth={playerHealth} weapon={weapon} hasSpear={hasSpear} merchantDay={merchantDay} wood={wood} onBuySpear={onBuySpear} handlers={interactionHandlers} onUnavailable={onUnavailable}
        remotePlayers={remotePlayers} onPlayerMove={onPlayerMove} onRevivePlayer={onRevivePlayer} onPlayerAttack={onPlayerAttack} onWorldHit={onWorldHit} worldHit={worldHit}
        authoritative={authoritative} sharedZombies={sharedZombies} zombieHit={zombieHit} onZombiesChange={onZombiesChange} onZombieHit={onZombieHit}
        sharedDrops={sharedDrops} onTakeDrop={onTakeDrop}
        onAttack={onAttack} onHarvest={onHarvest} onCrateLoot={onCrateLoot} onPlayerDamage={onPlayerDamage}
        onBaseDamage={onBaseDamage} onNightCleared={onNightCleared} />
      {!mobileMode && <p className="controls">{t('controls')}{hasSpear && ` · Q — ${language === 'en' ? 'switch weapon' : language === 'kk' ? 'қаруды ауыстыру' : 'сменить оружие'}`}
        {remotePlayers.some((player) => player.downed) && ` · V — ${language === 'en' ? 'revive teammate' : language === 'kk' ? 'одақтасты емдеу' : 'вылечить союзника'}`}</p>}
    </section>
  );
}
