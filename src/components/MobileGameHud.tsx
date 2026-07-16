import type { Phase } from '../game/types';
import { useI18n } from '../i18n/I18nContext';

interface Props { phase: Phase; day: number; maxNights: number; baseHealth: number; playerHealth: number }

export function MobileGameHud({ phase, day, maxNights, baseHealth, playerHealth }: Props) {
  const { t } = useI18n();
  return <div className="mobile-game-hud">
    <div className="mobile-game-hud__row"><strong>{phase === 'night' ? t('night') : t('day')} {day}/{maxNights}</strong><span>{t('base')} {baseHealth}%</span></div>
    <div className="mobile-game-hud__health" aria-label={`${t('health')} ${playerHealth}%`}><i style={{ width: `${playerHealth}%` }} /></div>
  </div>;
}
