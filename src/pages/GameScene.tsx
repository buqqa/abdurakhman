import { useCallback, useEffect, useRef, useState } from 'react';
import { GameWorld } from '../components/GameWorld';
import { useGameLoop } from '../game/useGameLoop';
import { InventoryPanel } from '../components/InventoryPanel';
import { VictoryScreen } from '../components/VictoryScreen';
import { DifficultyScreen } from '../components/DifficultyScreen';
import { DefeatScreen } from '../components/DefeatScreen';
import { PauseMenu } from '../components/PauseMenu';
import { DeviceScreen, type DeviceMode } from '../components/DeviceScreen';
import { MobileControls } from '../components/MobileControls';
import { PlayModeScreen } from '../components/PlayModeScreen';
import { PartyScreen, type PartyGameSettings } from '../components/PartyScreen';
import { useMultiplayerRoom } from '../game/multiplayer';
import { PartyGameBadge } from '../components/PartyGameBadge';
import { MAX_BASE_HEALTH, REPAIR_WOOD_COST } from '../game/config';
import { useControls } from '../game/controls';

export function GameScene({ playerNickname, isRegistered }: { playerNickname: string; isRegistered: boolean }) {
  const { bindings } = useControls();
  const [isPaused, setIsPaused] = useState(false);
  const [pendingGame, setPendingGame] = useState<{ nights: number; difficulty: string }>();
  const [playMode, setPlayMode] = useState<'solo' | 'friend' | undefined>(() => isRegistered ? undefined : 'solo');
  const [party, setParty] = useState<PartyGameSettings>();
  const [device, setDevice] = useState<DeviceMode>();
  const [mobileHeight, setMobileHeight] = useState(() => window.innerHeight);
  const { game, startGame, gatherWood, gatherCrateLoot, gatherFood, gatherWater, eatFood, drinkWater, dropResource, receiveResource, interactionUnavailable, attack, buySpear, switchWeapon, repairBase, applyTeammateRepair, startNight, damagePlayer, revivePlayer, payReviveCost, damageBase, finishNight, restart, syncSharedGame, pauseClock, resumeClock } = useGameLoop();
  const multiplayer = useMultiplayerRoom(party?.code, playerNickname, party?.maxPlayers);
  const handledRepairs = useRef(0);
  useEffect(() => { handledRepairs.current = 0; }, [party?.code]);
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
    if (multiplayer.playerDamage) damagePlayer(multiplayer.playerDamage.damage, true);
  }, [multiplayer.playerDamage?.nonce]);
  useEffect(() => {
    if (multiplayer.worldTake?.targetId === multiplayer.localPlayerId) receiveResource(multiplayer.worldTake.kind);
  }, [multiplayer.worldTake?.nonce]);
  useEffect(() => {
    if (multiplayer.resourceGrant?.targetId === multiplayer.localPlayerId) receiveResource(multiplayer.resourceGrant.kind);
  }, [multiplayer.resourceGrant?.nonce]);
  useEffect(() => {
    if (!multiplayer.isLeader) return;
    const pending = multiplayer.baseRepairSignal - handledRepairs.current;
    handledRepairs.current = multiplayer.baseRepairSignal;
    for (let repair = 0; repair < pending; repair += 1) applyTeammateRepair();
  }, [multiplayer.baseRepairSignal]);
  useEffect(() => {
    if (multiplayer.isLeader && multiplayer.startNightSignal && game.phase === 'day') startNight();
  }, [multiplayer.startNightSignal]);
  useEffect(() => {
    if (!party || game.phase === 'menu') return;
    if (multiplayer.isLeader) multiplayer.sendGame({ day: game.day, phase: game.phase, baseHealth: game.baseHealth, maxNights: game.maxNights, difficulty: game.difficulty, merchantDay: game.merchantDay, completionTime: game.completionTime, paused: isPaused });
    else if (multiplayer.sharedGame) {
      syncSharedGame(multiplayer.sharedGame);
      setIsPaused(multiplayer.sharedGame.paused);
    }
  }, [game.baseHealth, game.completionTime, game.day, game.difficulty, game.maxNights, game.merchantDay, game.phase, isPaused, multiplayer.isLeader, multiplayer.sendGame, multiplayer.sharedGame, party, syncSharedGame]);
  useEffect(() => {
    if (!party || !multiplayer.isLeader || !multiplayer.stateRequest) return;
    multiplayer.sendGame({ day: game.day, phase: game.phase, baseHealth: game.baseHealth, maxNights: game.maxNights, difficulty: game.difficulty, merchantDay: game.merchantDay, completionTime: game.completionTime, paused: isPaused });
    multiplayer.sendZombies();
    multiplayer.sendDrops(multiplayer.drops);
    multiplayer.sendWorld();
  }, [multiplayer.isLeader, multiplayer.stateRequest]);
  useEffect(() => {
    const handlePause = (event: KeyboardEvent) => {
      if (event.code !== 'Escape' || (party && !multiplayer.isLeader) || (game.phase !== 'day' && game.phase !== 'night')) return;
      setIsPaused((paused) => {
        if (paused) resumeClock(); else pauseClock();
        return !paused;
      });
    };
    window.addEventListener('keydown', handlePause);
    return () => window.removeEventListener('keydown', handlePause);
  }, [game.phase, multiplayer.isLeader, party, pauseClock, resumeClock]);
  useEffect(() => {
    const handleWeaponSwitch = (event: KeyboardEvent) => {
      if (event.code === bindings.switchWeapon && !event.repeat && !isPaused) switchWeapon();
    };
    window.addEventListener('keydown', handleWeaponSwitch);
    return () => window.removeEventListener('keydown', handleWeaponSwitch);
  }, [bindings.switchWeapon, isPaused, switchWeapon]);
  useEffect(() => {
    const handleStartNight = (event: KeyboardEvent) => {
      if (event.code !== bindings.startNight || event.repeat || device !== 'desktop' || isPaused || game.phase !== 'day') return;
      event.preventDefault();
      if (party && !multiplayer.isLeader) multiplayer.sendStartNight(); else startNight();
    };
    window.addEventListener('keydown', handleStartNight);
    return () => window.removeEventListener('keydown', handleStartNight);
  }, [bindings.startNight, device, game.phase, isPaused, multiplayer.isLeader, multiplayer.sendStartNight, party, startNight]);
  useEffect(() => {
    if (device !== 'mobile') return;
    const updateHeight = () => setMobileHeight(window.visualViewport?.height ?? window.innerHeight);
    updateHeight();
    const lockAfterRotation = () => window.setTimeout(updateHeight, 120);
    window.addEventListener('orientationchange', lockAfterRotation);
    window.addEventListener('resize', updateHeight);
    window.visualViewport?.addEventListener('resize', updateHeight);
    return () => {
      window.removeEventListener('orientationchange', lockAfterRotation);
      window.removeEventListener('resize', updateHeight);
      window.visualViewport?.removeEventListener('resize', updateHeight);
    };
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
  const repairSharedBase = () => {
    if (party && !multiplayer.isLeader && game.baseHealth < MAX_BASE_HEALTH && game.wood >= REPAIR_WOOD_COST) multiplayer.sendBaseRepair();
    repairBase();
  };
  const pauseFromMobile = () => {
    if (party && !multiplayer.isLeader) return;
    pauseClock();
    setIsPaused(true);
  };
  const interactionHandlers = { building: repairSharedBase, food: gatherFood, water: gatherWater };
  const isFinished = game.phase === 'won' || game.phase === 'lost';
  return (
    <main className={`game-shell ${device === 'mobile' ? 'game-shell--mobile' : ''}`} style={device === 'mobile' ? { height: mobileHeight } : undefined}>
      {party && <PartyGameBadge code={party.code} players={multiplayer.memberCount} maxPlayers={party.maxPlayers} />}
      <GameWorld paused={isPaused} mobileMode={device === 'mobile'} playerNickname={playerNickname} phase={game.phase} day={game.day} difficulty={game.difficulty} baseHealth={game.baseHealth} maxNights={game.maxNights} playerHealth={game.playerHealth} weapon={game.weapon} hasSpear={game.hasSpear} merchantDay={game.merchantDay} wood={game.wood} onBuySpear={buySpear} interactionHandlers={interactionHandlers} onUnavailable={interactionUnavailable}
        multiplayerMode={Boolean(party)}
        remotePlayers={multiplayer.players} onPlayerMove={sendPlayerPosition} onRevivePlayer={reviveTeammate} onPlayerAttack={multiplayer.sendPlayerAttack} onWorldHit={multiplayer.sendWorldHit} worldHit={multiplayer.worldHit}
        sharedWorld={multiplayer.sharedWorld} worldTake={multiplayer.worldTake} onWorldState={multiplayer.sendWorld} onWorldTake={multiplayer.takeWorldObject}
        zombieDeath={multiplayer.zombieDeath} onZombieDeath={multiplayer.sendZombieDeath}
        onRemotePlayerDamage={multiplayer.damageRemotePlayer}
        authoritative={!party || multiplayer.isLeader} sharedZombies={multiplayer.zombies} zombieHit={multiplayer.zombieHit} onZombiesChange={multiplayer.sendZombies} onZombieHit={multiplayer.sendZombieHit}
        sharedDrops={multiplayer.drops} onTakeDrop={(drop) => multiplayer.takeResource(drop.id)}
        onAttack={attack} onHarvest={gatherWood} onCrateLoot={gatherCrateLoot}
        onPlayerDamage={(damage) => damagePlayer(damage, Boolean(party))} onBaseDamage={damageBase} onNightCleared={finishNight} />
      <InventoryPanel wood={game.wood} food={game.food} water={game.water} onEat={eatFood} onDrink={drinkWater} onDrop={party ? (kind) => { if (game[kind] < 1) return; dropResource(kind); multiplayer.dropResource(kind); } : undefined} />
      {device === 'mobile' && <MobileControls enabled={!isPaused && !isFinished} canStartNight={game.phase === 'day'} canPause={!party || multiplayer.isLeader} onPause={pauseFromMobile} onStartNight={() => { if (party && !multiplayer.isLeader) multiplayer.sendStartNight(); else startNight(); }} />}
      {game.phase === 'won' && <VictoryScreen seconds={game.completionTime ?? 0} nights={game.maxNights} onRestart={returnToMenu} />}
      {game.phase === 'lost' && <DefeatScreen message={game.message} onRestart={returnToMenu} />}
      {isPaused && (party && !multiplayer.isLeader
        ? <PauseMenu locked />
        : <PauseMenu onContinue={() => { resumeClock(); setIsPaused(false); }} onEnd={() => { resumeClock(); setIsPaused(false); returnToMenu(); }} />)}
    </main>
  );
}
