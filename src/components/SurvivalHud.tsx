import { useI18n } from '../i18n/I18nContext';
import type { Phase } from '../game/types';

interface Props { phase: Phase; day: number; baseHealth: number; playerHealth: number }

export function SurvivalHud({ phase, day, baseHealth, playerHealth }: Props) {
  const { t } = useI18n();
  return <div className="survival-hud">
    <section className="survival-hud__vitals">
      <div className="hud-hearts" aria-label={`${t('health')} ${playerHealth}%`}>{Array.from({ length: 10 }, (_, index) => {
        const remaining = playerHealth - index * 10;
        return <span className={remaining >= 10 ? 'full' : remaining > 0 ? 'half' : 'empty'} key={index} />;
      })}</div>
      <div className="hud-armor" aria-label={`${t('base')} ${baseHealth}%`}>{Array.from({ length: 10 }, (_, index) => {
        const remaining = baseHealth - index * 10;
        return <span className={remaining >= 10 ? 'full' : remaining > 0 ? 'half' : 'empty'} key={index}><i /></span>;
      })}</div>
    </section>
    {phase === 'day' && <div className="day-announcement" key={`day-${day}`}>
      <span className="day-announcement__sun" />
      <strong>{t('day')} {day}</strong>
    </div>}
  </div>;
}
