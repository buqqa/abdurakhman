import { useI18n } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/translations';

interface Difficulty { name: string; nights: number; description: TranslationKey }

const difficulties: Difficulty[] = [
  { name: 'ROOKIE — PEACEFUL', nights: 5, description: 'rookieInfo' },
  { name: 'SURVIVOR', nights: 10, description: 'survivorInfo' },
  { name: 'NIGHTMARE', nights: 20, description: 'nightmareInfo' },
];

export function DifficultyScreen({ onSelect }: { onSelect: (nights: number, name: string) => void }) {
  const { t } = useI18n();
  return (
    <main className="difficulty-screen">
      <p>2D survival</p><h1>Forest Base</h1>
      <h2>{t('chooseDifficulty')}</h2>
      <div className="difficulty-grid">
        {difficulties.map((difficulty) => (
          <button className="difficulty-card" onClick={() => onSelect(difficulty.nights, difficulty.name)} key={difficulty.name}>
            <strong>{difficulty.name}</strong><span>{difficulty.nights} {t('nights')}</span><small>{t(difficulty.description)}</small>
          </button>
        ))}
      </div>
    </main>
  );
}
