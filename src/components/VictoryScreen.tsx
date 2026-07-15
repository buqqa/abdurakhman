interface Props { seconds: number; nights: number; onRestart: () => void }

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function VictoryScreen({ seconds, nights, onRestart }: Props) {
  return (
    <div className="victory-backdrop">
      <section className="victory-screen">
        <span className="victory-screen__sun">☀</span>
        <p>Спасатели прибыли</p><h2>Ты пережил {nights} ночей!</h2>
        <div className="victory-time"><span>Время прохождения</span><strong>{formatTime(seconds)}</strong></div>
        <button onClick={onRestart}>Сыграть ещё раз</button>
      </section>
    </div>
  );
}
