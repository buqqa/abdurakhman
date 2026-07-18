import { useCallback, useEffect, useState } from 'react';
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
import { PlayModeScreen } from '../components/PlayModeScreen';
import { PartyScreen, type PartyGameSettings } from '../components/PartyScreen';
import { useMultiplayerRoom } from '../game/multiplayer';
import { PartyGameBadge } from '../components/PartyGameBadge';

export function GameScene({ playerNickname, isRegistered }: { playerNickname: string; isRegistered: boolean }) {
  const { t } = useI18n();
  const [isPaused, setIsPaused] = useState(false);
  const [pendingGame, setPendingGame] = useState<{ nights: number; difficulty: string }>();
  const [playMode, setPlayMode] = useState<'solo' | 'friend' | undefined>(() => isRegistered ? undefined : 'solo');
  const [party, setParty] = useState<PartyGameSettings>();
  const [device, setDevice] = useState<DeviceMode>();
  const [mobileHeight, setMobileHeight] = useState(() => window.innerHeight);
  const { game, startGame, gatherWood, gatherCrateLoot, gatherFood, gatherWater, eatFood, drinkWater, dropResource, receiveResource, interactionUnavailable, attack, buySpear, switchWeapon, repairBase, startNight, damagePlayer, revivePlayer, payReviveCost, damageBase, finishNight, restart, syncSharedGame, pauseClock, resumeClock } = useGameLoop();
  const multiplayer = useMultiplayerRoom(party?.code, playerNickname, party?.maxPlayers);
  const sendPlayerPosition = useCallback((position: { x: number; y: number }) => {
    multiplayer.sendPosition(position, game.weapon, game.playerHealth);
  }, [game.playerHealth, game.weapon, multiplayer.sendPosition]);
  const reviveTeammate = (targetId: string) => {
    if (game.playerHealth <= 1 || !multiplayer.players.some((player) => player.id === targetId && player.downed)) return;
    payReviveCost();
    multiplayer.revivePlayer(targetId);
  };
  useEffect(() => {
    if (multiplayer.reviveSignal) revivePlayer();
  }, [multiplayer.reviveSignal]);
  useEffect(() => {
    if (!party || game.phase === 'menu') return;
    if (party.role === 'host') multiplayer.sendGame({ day: game.day, phase: game.phase, baseHealth: game.baseHealth, maxNights: game.maxNights, difficulty: game.difficulty, merchantDay: game.merchantDay });
    else if (multiplayer.sharedGame) syncSharedGame(multiplayer.sharedGame);
  }, [game.baseHealth, game.day, game.difficulty, game.maxNights, game.merchantDay, game.phase, multiplayer.sendGame, multiplayer.sharedGame, party, syncSharedGame]);
  useEffect(() => {
    if (party?.role !== 'host' || !multiplayer.stateRequest) return;
    multiplayer.sendGame({ day: game.day, phase: game.phase, baseHealth: game.baseHealth, maxNights: game.maxNights, difficulty: game.difficulty, merchantDay: game.merchantDay });
    multiplayer.sendZombies();
    multiplayer.sendDrops(multiplayer.drops);
  }, [multiplayer.stateRequest]);
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
  useEffect(() => {
    if (device !== 'mobile') return;
    setMobileHeight(window.innerHeight);
    const lockAfterRotation = () => window.setTimeout(() => setMobileHeight(window.innerHeight), 120);
    window.addEventListener('orientationchange', lockAfterRotation);
    return () => window.removeEventListener('orientationchange', lockAfterRotation);
  }, [device]);
  const returnToMenu = () => { setPendingGame(undefined); setParty(undefined); setPlayMode(isRegistered ? undefined : 'solo'); setDevice(undefined); restart(); };
  if (game.phase === 'menu') {
    if (pendingGame) return <DeviceScreen onBack={() => setPendingGame(undefined)} onSelect={(selectedDevice) => {
      setDevice(selectedDevice);
      startGame(pendingGame.nights, pendingGame.difficulty);
    }} />;
    if (!playMode) return <PlayModeScreen onSolo={() => setPlayMode('solo')} onFriend={() => setPlayMode('friend')} />;
    if (playMode === 'friend') return <PartyScreen onBack={() => setPlayMode(undefined)} onReady={(settings) => { setParty(settings); setPendingGame(settings); }} />;
    return <DifficultyScreen onBack={isRegistered ? () => setPlayMode(undefined) : undefined} onSelect={(nights, difficulty) => setPendingGame({ nights, difficulty })} />;
  }
  if (party && multiplayer.roomFull) return <main className="setup-screen"><p>Forest Base</p><h1>Комната заполнена</h1>
    <p className="party-note">В этой комнате уже {party.maxPlayers} игрока. Попроси новый код или создай свою комнату.</p>
    <button onClick={returnToMenu}>Вернуться в меню</button></main>;
  const interactionHandlers = { building: repairBase, food: gatherFood, water: gatherWater };
  const isFinished = game.phase === 'won' || game.phase === 'lost';
  return (
    <main className={`game-shell ${device === 'mobile' ? 'game-shell--mobile' : ''}`} style={device === 'mobile' ? { height: mobileHeight } : undefined}>
      {device !== 'mobile' && <><div className="title-row"><div><p>2D survival</p><h1>Forest Base</h1></div><span className="goal">{t('goal', { count: game.maxNights })}</span></div>
      <GameHud game={game} /><PlayerStats health={game.playerHealth} /></>}
      {party && <PartyGameBadge code={party.code} players={multiplayer.memberCount} maxPlayers={party.maxPlayers} />}
      <GameWorld paused={isPaused} mobileMode={device === 'mobile'} playerNickname={playerNickname} phase={game.phase} day={game.day} difficulty={game.difficulty} baseHealth={game.baseHealth} maxNights={game.maxNights} playerHealth={game.playerHealth} weapon={game.weapon} hasSpear={game.hasSpear} merchantDay={game.merchantDay} wood={game.wood} onBuySpear={buySpear} interactionHandlers={interactionHandlers} onUnavailable={interactionUnavailable}
        remotePlayers={multiplayer.players} onPlayerMove={sendPlayerPosition} onRevivePlayer={reviveTeammate} onPlayerAttack={multiplayer.sendPlayerAttack} onWorldHit={multiplayer.sendWorldHit} worldHit={multiplayer.worldHit}
        authoritative={!party || party.role === 'host'} sharedZombies={multiplayer.zombies} zombieHit={multiplayer.zombieHit} onZombiesChange={multiplayer.sendZombies} onZombieHit={multiplayer.sendZombieHit}
        sharedDrops={multiplayer.drops} onTakeDrop={(drop) => { multiplayer.takeResource(drop.id); receiveResource(drop.kind); }}
        onAttack={attack} onHarvest={gatherWood} onCrateLoot={gatherCrateLoot}
        onPlayerDamage={(damage) => damagePlayer(damage, Boolean(party))} onBaseDamage={damageBase} onNightCleared={finishNight} />
      <InventoryPanel wood={game.wood} food={game.food} water={game.water} showHint={device !== 'mobile'} onEat={eatFood} onDrink={drinkWater} onDrop={party ? (kind) => { if (game[kind] < 1) return; dropResource(kind); multiplayer.dropResource(kind); } : undefined} />
      {device === 'mobile' && <MobileControls enabled={!isPaused && !isFinished} />}
      <section className={`status ${isFinished ? 'status--result' : ''}`}>
        <p>{game.message}</p>
        <GameActions phase={game.phase} canStart={!party || party.role === 'host'} onNext={startNight} onRestart={returnToMenu} />
      </section>
      {game.phase === 'won' && <VictoryScreen seconds={game.completionTime ?? 0} nights={game.maxNights} onRestart={returnToMenu} />}
      {game.phase === 'lost' && <DefeatScreen message={game.message} onRestart={returnToMenu} />}
      {isPaused && <PauseMenu onContinue={() => { resumeClock(); setIsPaused(false); }}
        onEnd={() => { resumeClock(); setIsPaused(false); returnToMenu(); }} />}
    </main>
  );
}
