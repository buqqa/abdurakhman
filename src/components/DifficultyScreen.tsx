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
    if (language === 'en') {
      if (difficulty.name === 'PEACEFUL') return 'A calm 15-night journey to explore, gather supplies and meet a boss every fifth night.';
      if (difficulty.name === 'SURVIVOR') return '25 nights of growing pressure: tougher waves, scarce supplies and bosses every five nights.';
      return 'A merciless 50-night marathon. Every fifth night brings a boss with triple health and damage.';
    }
    if (language === 'kk') {
      if (difficulty.name === 'PEACEFUL') return 'Орманды зерттеп, қор жинауға арналған тыныш 15 түн. Әр бесінші түнде босс келеді.';
      if (difficulty.name === 'SURVIVOR') return 'Қысымы арта беретін 25 түн: толқындар күшейеді, қор азаяды, әр бесінші түнде босс шығады.';
      return 'Аяусыз 50 түндік сынақ. Әр бесінші түнде денсаулығы мен зақымы үш есе көп босс келеді.';
    }
    if (difficulty.name === 'PEACEFUL') return 'Спокойные 15 ночей для исследования леса и сбора припасов. Каждую пятую ночь приходит босс.';
    if (difficulty.name === 'SURVIVOR') return '25 ночей нарастающего давления: волны сильнее, припасов меньше, а босс приходит каждые пять ночей.';
    return 'Беспощадный марафон на 50 ночей. Каждую пятую ночь приходит босс с тройным здоровьем и уроном.';
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
