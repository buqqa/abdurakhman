import { useEffect } from 'react';
import { playGameSound } from '../lib/gameAudio';
import { useI18n } from '../i18n/I18nContext';

interface Props { message: string; onRestart: () => void }

export function DefeatScreen({ message, onRestart }: Props) {
  const { t } = useI18n();
  useEffect(() => playGameSound('defeat'), []);
  return (
    <div className="defeat-backdrop">
      <section className="defeat-screen">
        <span>☠</span><p>{t('ended')}</p><h2>{t('defeat')}</h2>
        <strong>{message}</strong>
        <button onClick={onRestart}>{t('tryAgain')}</button>
      </section>
    </div>
  );
}
