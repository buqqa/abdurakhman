import { useI18n } from '../i18n/I18nContext';

interface Props { onContinue: () => void; onEnd: () => void }

export function PauseMenu({ onContinue, onEnd }: Props) {
  const { language } = useI18n();
  const text = language === 'en'
    ? { title: 'PAUSED', continue: 'Continue', end: 'End survival' }
    : language === 'kk'
      ? { title: 'ҮЗІЛІС', continue: 'Жалғастыру', end: 'Аман қалуды аяқтау' }
      : { title: 'ПАУЗА', continue: 'Продолжить', end: 'Завершить выживание' };
  return (
    <div className="pause-backdrop"><section className="pause-menu">
      <span>Ⅱ</span><h2>{text.title}</h2>
      <button onClick={onContinue}>{text.continue}</button>
      <button className="pause-menu__end" onClick={onEnd}>{text.end}</button>
    </section></div>
  );
}
