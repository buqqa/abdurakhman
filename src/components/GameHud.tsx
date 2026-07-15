import type { GameState } from '../game/types';
import { useI18n } from '../i18n/I18nContext';

export function GameHud({ game }: { game: GameState }) {
  const { t } = useI18n();
  const phaseName = game.phase === 'night' ? t('night') : t('day');
  return (
    <header className="game-hud">
      <div><span>{game.difficulty}</span><strong>{phaseName} {game.day}/{game.maxNights}</strong></div>
      <div><span>{t('base')}</span><strong>{game.baseHealth}%</strong></div>
    </header>
  );
}
