import { useEffect } from 'react';
import { Auth } from './Auth';
import { LobbySettings } from './LobbySettings';
import { useI18n } from '../i18n/I18nContext';
import { startBackgroundMusic } from '../lib/gameAudio';

type StartMenuProps = {
  onGuestLogin: () => void;
};

export function StartMenu({ onGuestLogin }: StartMenuProps) {
  const { t } = useI18n();
  useEffect(() => {
    const startMusic = () => startBackgroundMusic();
    window.addEventListener('pointerdown', startMusic, { once: true });
    window.addEventListener('keydown', startMusic, { once: true });
    return () => { window.removeEventListener('pointerdown', startMusic); window.removeEventListener('keydown', startMusic); };
  }, []);
  return (
    <main className="start-menu">
      <section className="start-menu__intro">
        <p>2D zombie survival</p><h1>Forest Base</h1>
        <h2>{t('tagline')}</h2>
        <ul><li>{t('explore')}</li><li>{t('supplies')}</li><li>{t('fight')}</li></ul>
        <LobbySettings />
      </section>
      <Auth onGuestLogin={onGuestLogin} />
    </main>
  );
}
