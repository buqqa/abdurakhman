import type { Phase } from '../game/types';
import { ForestMap } from './ForestMap';
import type { InteractionHandlers } from '../game/interactions';
import type { Weapon } from '../game/types';
import type { CrateKind } from '../game/interactions';
import { useI18n } from '../i18n/I18nContext';

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
}

export function GameWorld({ paused, mobileMode, playerNickname, phase, day, difficulty, baseHealth, maxNights, playerHealth, weapon, hasSpear, merchantDay, wood, onBuySpear, interactionHandlers, onUnavailable, onAttack, onHarvest, onCrateLoot, onPlayerDamage, onBaseDamage, onNightCleared }: Props) {
  const { t, language } = useI18n();
  return (
    <section>
      <ForestMap paused={paused} mobileMode={mobileMode} playerNickname={playerNickname} phase={phase} day={day} difficulty={difficulty} baseHealth={baseHealth} maxNights={maxNights} playerHealth={playerHealth} weapon={weapon} hasSpear={hasSpear} merchantDay={merchantDay} wood={wood} onBuySpear={onBuySpear} handlers={interactionHandlers} onUnavailable={onUnavailable}
        onAttack={onAttack} onHarvest={onHarvest} onCrateLoot={onCrateLoot} onPlayerDamage={onPlayerDamage}
        onBaseDamage={onBaseDamage} onNightCleared={onNightCleared} />
      {!mobileMode && <p className="controls">{t('controls')}{hasSpear && ` · Q — ${language === 'en' ? 'switch weapon' : language === 'kk' ? 'қаруды ауыстыру' : 'сменить оружие'}`}</p>}
    </section>
  );
}
