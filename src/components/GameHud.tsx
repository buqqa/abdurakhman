import type { GameState } from '../game/types';

export function GameHud({ game }: { game: GameState }) {
  const phaseName = game.phase === 'night' ? 'Ночь' : 'День';
  return (
    <header className="game-hud">
      <div><span>{game.difficulty}</span><strong>{phaseName} {game.day}/{game.maxNights}</strong></div>
      <div><span>База</span><strong>{game.baseHealth}%</strong></div>
    </header>
  );
}
