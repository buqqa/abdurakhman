interface Difficulty { name: string; nights: number; description: string }

const difficulties: Difficulty[] = [
  { name: 'ROOKIE', nights: 5, description: 'Короткое выживание для знакомства с лесом.' },
  { name: 'SURVIVOR', nights: 10, description: 'Больше волн и меньше времени на ошибки.' },
  { name: 'NIGHTMARE', nights: 20, description: 'Долгая борьба за каждый ресурс.' },
];

export function DifficultyScreen({ onSelect }: { onSelect: (nights: number, name: string) => void }) {
  return (
    <main className="difficulty-screen">
      <p>2D survival</p><h1>Forest Base</h1>
      <h2>Choose your fate</h2>
      <div className="difficulty-grid">
        {difficulties.map((difficulty) => (
          <button className="difficulty-card" onClick={() => onSelect(difficulty.nights, difficulty.name)} key={difficulty.name}>
            <strong>{difficulty.name}</strong><span>{difficulty.nights} ночей</span><small>{difficulty.description}</small>
          </button>
        ))}
      </div>
    </main>
  );
}
