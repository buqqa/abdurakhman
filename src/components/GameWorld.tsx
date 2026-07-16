import type { Phase } from '../game/types';
import { ForestMap } from './ForestMap';
import type { InteractionHandlers } from '../game/interactions';
import type { Fence, Weapon } from '../game/types';
import type { Position } from './PlayerController';
import type { CrateKind } from '../game/interactions';
import { useI18n } from '../i18n/I18nContext';

interface Props {
  paused: boolean;
  playerNickname: string;
  phase: Phase;
  day: number;
  baseHealth: number;
  weapon: Weapon;
  merchantDay: number;
  wood: number;
  onBuySpear: () => void;
  interactionHandlers: InteractionHandlers;
  onUnavailable: () => void;
  onAttack: () => void;
  onHarvest: () => void;
  onCrateLoot: (kind: CrateKind) => void;
  fences: Fence[];
  onBuildFence: (position: Position) => void;
  onPlayerDamage: (damage: number) => void;
  onBaseDamage: (damage: number) => void;
  onNightCleared: () => void;
}

export function GameWorld({ paused, playerNickname, phase, day, baseHealth, weapon, merchantDay, wood, onBuySpear, fences, interactionHandlers, onUnavailable, onAttack, onHarvest, onCrateLoot, onBuildFence, onPlayerDamage, onBaseDamage, onNightCleared }: Props) {
  const { t } = useI18n();
  return (
    <section>
      <ForestMap paused={paused} playerNickname={playerNickname} phase={phase} day={day} baseHealth={baseHealth} weapon={weapon} merchantDay={merchantDay} wood={wood} onBuySpear={onBuySpear} fences={fences} handlers={interactionHandlers} onUnavailable={onUnavailable}
        onAttack={onAttack} onHarvest={onHarvest} onCrateLoot={onCrateLoot} onBuildFence={onBuildFence} onPlayerDamage={onPlayerDamage}
        onBaseDamage={onBaseDamage} onNightCleared={onNightCleared} />
      <p className="controls">{t('controls')}</p>
    </section>
  );
}
