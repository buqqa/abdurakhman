import { useI18n } from '../i18n/I18nContext';
import { useState } from 'react';
import { GameSettings } from './GameSettings';

interface Props { onContinue?: () => void; onEnd?: () => void; locked?: boolean }

export function PauseMenu({ onContinue, onEnd, locked = false }: Props) {
  const { language } = useI18n();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const text = language === 'en'
    ? { title: 'PAUSED', waiting: 'The room owner paused the game', continue: 'Continue', settings: 'Settings', end: 'End survival' }
    : language === 'kk'
      ? { title: 'ҮЗІЛІС', waiting: 'Бөлме иесі ойынды тоқтатты', continue: 'Жалғастыру', settings: 'Баптаулар', end: 'Аман қалуды аяқтау' }
      : { title: 'ПАУЗА', waiting: 'Владелец комнаты приостановил игру', continue: 'Продолжить', settings: 'Настройки', end: 'Завершить выживание' };
  if (settingsOpen) return <div className="pause-backdrop"><GameSettings onBack={() => setSettingsOpen(false)} /></div>;
  return (
    <div className="pause-backdrop"><section className="pause-menu">
      <h2>{text.title}</h2>
      {locked && <p>{text.waiting}</p>}
      {!locked && <button onClick={onContinue}>{text.continue}</button>}
      <button onClick={() => setSettingsOpen(true)}>{text.settings}</button>
      {!locked && <button className="pause-menu__end" onClick={onEnd}>{text.end}</button>}
    </section></div>
  );
}
