import { useEffect } from 'react';
import { playGameSound } from '../lib/gameAudio';

interface Props { message: string; onRestart: () => void }

export function DefeatScreen({ message, onRestart }: Props) {
  useEffect(() => playGameSound('defeat'), []);
  return (
    <div className="defeat-backdrop">
      <section className="defeat-screen">
        <span>☠</span><p>Выживание окончено</p><h2>ПОРАЖЕНИЕ</h2>
        <strong>{message}</strong>
        <button onClick={onRestart}>Попробовать снова</button>
      </section>
    </div>
  );
}
