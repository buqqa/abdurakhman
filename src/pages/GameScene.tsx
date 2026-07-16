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
import { DeviceScreen, type DeviceMode } from '../components/DeviceScreen';
import { MobileControls } from '../components/MobileControls';

export function GameScene({ playerNickname }: { playerNickname: string }) {
  const { t } = useI18n();
  const [isPaused, setIsPaused] = useState(false);
  const [pendingGame, setPendingGame] = useState<{ nights: number; difficulty: string }>();
  const [device, setDevice] = useState<DeviceMode>();
  const { game, startGame, gatherWood, gatherCrateLoot, gatherFood, gatherWater, eatFood, drinkWater, interactionUnavailable, attack, buySpear, switchWeapon, repairBase, startNight, damagePlayer, damageBase, finishNight, restart, pauseClock, resumeClock } = useGameLoop();
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
  useEffect(() => {
    const handleWeaponSwitch = (event: KeyboardEvent) => {
      if (event.code === 'KeyQ' && !event.repeat && !isPaused) switchWeapon();
    };
    window.addEventListener('keydown', handleWeaponSwitch);
    return () => window.removeEventListener('keydown', handleWeaponSwitch);
  }, [isPaused, switchWeapon]);
  const returnToMenu = () => { setPendingGame(undefined); setDevice(undefined); restart(); };
  if (game.phase === 'menu') {
    if (pendingGame) return <DeviceScreen onBack={() => setPendingGame(undefined)} onSelect={(selectedDevice) => {
      setDevice(selectedDevice);
      startGame(pendingGame.nights, pendingGame.difficulty);
    }} />;
    return <DifficultyScreen onSelect={(nights, difficulty) => setPendingGame({ nights, difficulty })} />;
  }
  const interactionHandlers = { building: repairBase, food: gatherFood, water: gatherWater };
  const isFinished = game.phase === 'won' || game.phase === 'lost';
  return (
    <main className={`game-shell ${device === 'mobile' ? 'game-shell--mobile' : ''}`}>
      {device !== 'mobile' && <><div className="title-row"><div><p>2D survival</p><h1>Forest Base</h1></div><span className="goal">{t('goal', { count: game.maxNights })}</span></div>
      <GameHud game={game} /><PlayerStats health={game.playerHealth} /></>}
      <GameWorld paused={isPaused} mobileMode={device === 'mobile'} playerNickname={playerNickname} phase={game.phase} day={game.day} difficulty={game.difficulty} baseHealth={game.baseHealth} maxNights={game.maxNights} playerHealth={game.playerHealth} weapon={game.weapon} hasSpear={game.hasSpear} merchantDay={game.merchantDay} wood={game.wood} onBuySpear={buySpear} interactionHandlers={interactionHandlers} onUnavailable={interactionUnavailable}
        onAttack={attack} onHarvest={gatherWood} onCrateLoot={gatherCrateLoot}
        onPlayerDamage={damagePlayer} onBaseDamage={damageBase} onNightCleared={finishNight} />
      <InventoryPanel wood={game.wood} food={game.food} water={game.water} onEat={eatFood} onDrink={drinkWater} />
      {device === 'mobile' && <MobileControls enabled={!isPaused && !isFinished} />}
      <section className={`status ${isFinished ? 'status--result' : ''}`}>
        <p>{game.message}</p>
        <GameActions phase={game.phase} onNext={startNight} onRestart={returnToMenu} />
      </section>
      {game.phase === 'won' && <VictoryScreen seconds={game.completionTime ?? 0} nights={game.maxNights} onRestart={returnToMenu} />}
      {game.phase === 'lost' && <DefeatScreen message={game.message} onRestart={returnToMenu} />}
      {isPaused && <PauseMenu onContinue={() => { resumeClock(); setIsPaused(false); }}
        onEnd={() => { resumeClock(); setIsPaused(false); returnToMenu(); }} />}
    </main>
  );
}
