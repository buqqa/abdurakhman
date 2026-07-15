import { useEffect, useState } from 'react';
import { GameActions } from '../components/GameActions';
import { GameHud } from '../components/GameHud';
import { GameWorld } from '../components/GameWorld';
import { useGameLoop } from '../game/useGameLoop';
import { InventoryPanel } from '../components/InventoryPanel';
import { PlayerStats } from '../components/PlayerStats';
import { VictoryScreen } from '../components/VictoryScreen';
import { DifficultyScreen } from '../components/DifficultyScreen';
import { DefeatScreen } from '../components/DefeatScreen';
import { useI18n } from '../i18n/I18nContext';
import { PauseMenu } from '../components/PauseMenu';

export function GameScene({ playerNickname }: { playerNickname: string }) {
  const { t } = useI18n();
  const [isPaused, setIsPaused] = useState(false);
  const { game, startGame, gatherWood, gatherCrateLoot, gatherFood, gatherWater, eatFood, drinkWater, interactionUnavailable, attack, repairBase, buildFence, startNight, damagePlayer, damageBase, finishNight, restart, pauseClock, resumeClock } = useGameLoop();
  useEffect(() => {
    const togglePause = (event: KeyboardEvent) => {
      if (event.code !== 'Escape' || (game.phase !== 'day' && game.phase !== 'night')) return;
      setIsPaused((paused) => {
        if (paused) resumeClock(); else pauseClock();
        return !paused;
      });
    };
    window.addEventListener('keydown', togglePause);
    return () => window.removeEventListener('keydown', togglePause);
  }, [game.phase, pauseClock, resumeClock]);
  if (game.phase === 'menu') return <DifficultyScreen onSelect={startGame} />;
  const interactionHandlers = { building: repairBase, food: gatherFood, water: gatherWater };
  const isFinished = game.phase === 'won' || game.phase === 'lost';
  return (
    <main className="game-shell">
      <div className="title-row"><div><p>2D survival</p><h1>Forest Base</h1></div><span className="goal">{t('goal', { count: game.maxNights })}</span></div>
      <GameHud game={game} />
      <PlayerStats health={game.playerHealth} />
      <GameWorld paused={isPaused} playerNickname={playerNickname} phase={game.phase} day={game.day} baseHealth={game.baseHealth} interactionHandlers={interactionHandlers} onUnavailable={interactionUnavailable}
        onAttack={attack} onHarvest={gatherWood} onCrateLoot={gatherCrateLoot} fences={game.fences} onBuildFence={buildFence}
        onPlayerDamage={damagePlayer} onBaseDamage={damageBase} onNightCleared={finishNight} />
      <InventoryPanel wood={game.wood} food={game.food} water={game.water} onEat={eatFood} onDrink={drinkWater} />
      <section className={`status ${isFinished ? 'status--result' : ''}`}>
        <p>{game.message}</p>
        <GameActions phase={game.phase} onNext={startNight} onRestart={restart} />
      </section>
      {game.phase === 'won' && <VictoryScreen seconds={game.completionTime ?? 0} nights={game.maxNights} onRestart={restart} />}
      {game.phase === 'lost' && <DefeatScreen message={game.message} onRestart={restart} />}
      {isPaused && <PauseMenu onContinue={() => { resumeClock(); setIsPaused(false); }}
        onRestart={() => { resumeClock(); setIsPaused(false); startGame(game.maxNights, game.difficulty); }}
        onQuit={() => { resumeClock(); setIsPaused(false); restart(); }} />}
    </main>
  );
}
