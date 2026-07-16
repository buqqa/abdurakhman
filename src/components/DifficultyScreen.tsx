import { useI18n } from '../i18n/I18nContext';

interface Difficulty { name: string; nights: number }

const difficulties: Difficulty[] = [
  { name: 'PEACEFUL', nights: 15 },
  { name: 'SURVIVOR', nights: 25 },
  { name: 'HARDCORE', nights: 50 },
];

export function DifficultyScreen({ onSelect }: { onSelect: (nights: number, name: string) => void }) {
  const { t, language } = useI18n();
  const describe = (difficulty: Difficulty) => {
    const boss = difficulty.name === 'HARDCORE';
    if (language === 'en') return `${difficulty.nights} nights. A boss appears every 5 nights.${boss ? ' Bosses have triple health and damage.' : ''}`;
    if (language === 'kk') return `${difficulty.nights} түн. Әр 5 түн сайын босс шығады.${boss ? ' Босстың денсаулығы мен зақымы үш есе көп.' : ''}`;
    return `${difficulty.nights} ночей. Каждые 5 ночей появляется босс.${boss ? ' У босса тройной запас здоровья и урон.' : ''}`;
  };
  return (
    <main className="difficulty-screen">
      <p>2D survival</p><h1>Forest Base</h1>
      <h2>{t('chooseDifficulty')}</h2>
      <div className="difficulty-grid">
        {difficulties.map((difficulty) => (
          <button className="difficulty-card" onClick={() => onSelect(difficulty.nights, difficulty.name)} key={difficulty.name}>
            <strong>{difficulty.name}</strong><span>{difficulty.nights} {t('nights')}</span><small>{describe(difficulty)}</small>
          </button>
        ))}
      </div>
    </main>
  );
}
