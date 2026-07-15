import { useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { playGameSound } from '../lib/gameAudio';

interface Props { seconds: number; nights: number; onRestart: () => void }

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function VictoryScreen({ seconds, nights, onRestart }: Props) {
  const { t } = useI18n();
  useEffect(() => playGameSound('victory'), []);
  return (
    <div className="victory-backdrop">
      <section className="victory-screen">
        <span className="victory-screen__sun">☀</span>
        <p>{t('survived')}</p><h2>{t('survivedNights', { count: nights })}</h2>
        <div className="victory-time"><span>{t('time')}</span><strong>{formatTime(seconds)}</strong></div>
        <button onClick={onRestart}>{t('playAgain')}</button>
      </section>
    </div>
  );
}
