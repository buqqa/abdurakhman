import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import type { Language } from '../i18n/translations';
import { getGameVolume, setGameVolume } from '../lib/gameAudio';

export function LobbySettings() {
  const { language, setLanguage, t } = useI18n();
  const [volume, setVolume] = useState(getGameVolume);
  const updateVolume = (next: number) => { setVolume(next); setGameVolume(next); };
  return (
    <section className="lobby-settings">
      <label>{t('language')}<span className="language-buttons">
        {(['ru', 'kk', 'en'] as Language[]).map((item) => <button type="button" className={language === item ? 'active' : ''} onClick={() => setLanguage(item)} key={item}>{item.toUpperCase()}</button>)}
      </span></label>
      <label>{t('sound')}<span className="volume-control"><span>♪</span><input type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => updateVolume(Number(event.target.value))} /><strong>{Math.round(volume * 100)}%</strong></span></label>
    </section>
  );
}
