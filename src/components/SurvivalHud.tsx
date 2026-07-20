import { useI18n } from '../i18n/I18nContext';

interface Props { day: number; maxNights: number; baseHealth: number; playerHealth: number }

export function SurvivalHud({ day, maxNights, baseHealth, playerHealth }: Props) {
  const { t } = useI18n();
  return <div className="survival-hud">
    <section className="survival-hud__vitals">
      <div className="hud-hearts" aria-label={`${t('health')} ${playerHealth}%`}>{Array.from({ length: 10 }, (_, index) => {
        const remaining = playerHealth - index * 10;
        return <span className={remaining >= 10 ? 'full' : remaining > 0 ? 'half' : 'empty'} key={index}>♥</span>;
      })}</div>
      <div className="hud-armor" aria-label={`${t('base')} ${baseHealth}%`}>{Array.from({ length: 10 }, (_, index) => {
        const remaining = baseHealth - index * 10;
        return <span className={remaining >= 10 ? 'full' : remaining > 0 ? 'half' : 'empty'} key={index}><i /></span>;
      })}</div>
    </section>
    <strong className="survival-hud__day">{t('day')} {day}/{maxNights}</strong>
  </div>;
}
