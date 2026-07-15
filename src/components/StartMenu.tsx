import { Auth } from './Auth';
import { LobbySettings } from './LobbySettings';
import { useI18n } from '../i18n/I18nContext';

type StartMenuProps = {
  onGuestLogin: () => void;
};

export function StartMenu({ onGuestLogin }: StartMenuProps) {
  const { t } = useI18n();
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
