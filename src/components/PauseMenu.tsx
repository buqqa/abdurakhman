import { useI18n } from '../i18n/I18nContext';

interface Props { onContinue: () => void; onRestart: () => void }

export function PauseMenu({ onContinue, onRestart }: Props) {
  const { language } = useI18n();
  const text = language === 'en'
    ? { title: 'PAUSED', continue: 'Continue', restart: 'Restart' }
    : language === 'kk'
      ? { title: 'ҮЗІЛІС', continue: 'Жалғастыру', restart: 'Қайта бастау' }
      : { title: 'ПАУЗА', continue: 'Продолжить', restart: 'Начать заново' };
  return (
    <div className="pause-backdrop"><section className="pause-menu">
      <span>Ⅱ</span><h2>{text.title}</h2>
      <button onClick={onContinue}>{text.continue}</button>
      <button onClick={onRestart}>{text.restart}</button>
    </section></div>
  );
}
