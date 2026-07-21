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
import { MAX_BASE_HEALTH, repairWoodCost } from '../game/config';
import { useControls } from '../game/controls';
import { WrenchFoundScreen } from '../components/WrenchFoundScreen';
import type { CrateKind } from '../game/interactions';

export function GameScene({ playerNickname, isRegistered }: { playerNickname: string; isRegistered: boolean }) {
  const { bindings } = useControls();
  const [isPaused, setIsPaused] = useState(false);
  const [pendingGame, setPendingGame] = useState<{ nights: number; difficulty: string }>();
  const [playMode, setPlayMode] = useState<'solo' | 'friend' | undefined>(() => isRegistered ? undefined : 'solo');
  const [party, setParty] = useState<PartyGameSettings>();
  const [device, setDevice] = useState<DeviceMode>();
  const [mobileHeight, setMobileHeight] = useState(() => window.innerHeight);
  const [wrenchInfoOpen, setWrenchInfoOpen] = useState(false);
  const { game, startGame, gatherWood, gatherCrateLoot, gatherFood, gatherWater, eatFood, drinkWater, dropResource, receiveResource, interactionUnavailable, attack, buySpear, buyAxe, buySword, switchWeapon, repairBase, applyTeammateRepair, startNight, damagePlayer, revivePlayer, payReviveCost, damageBase, finishNight, restart, syncSharedGame, pauseClock, resumeClock } = useGameLoop();
  const multiplayer = useMultiplayerRoom(party?.code, playerNickname, party?.maxPlayers);
  const handledRepairs = useRef(0);
  const handledPlayerDamage = useRef(0);
  const handledCrateGrants = useRef(new Set<string>());
  const handledResourceGrants = useRef(new Set<string>());
  useEffect(() => { handledRepairs.current = 0; handledPlayerDamage.current = 0; handledCrateGrants.current.clear(); handledResourceGrants.current.clear(); }, [party?.code]);
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
    const damage = multiplayer.playerDamageTotal - handledPlayerDamage.current;
    handledPlayerDamage.current = multiplayer.playerDamageTotal;
    if (damage > 0) damagePlayer(damage, multiplayer.memberCount > 1);
  }, [multiplayer.memberCount, multiplayer.playerDamageTotal]);
  useEffect(() => {
    if (party && multiplayer.memberCount <= 1 && game.phase === 'night' && game.playerHealth <= 0) damagePlayer(1, false);
  }, [game.phase, game.playerHealth, multiplayer.memberCount, party]);
  useEffect(() => {
    [...multiplayer.worldTakes, ...multiplayer.resourceGrants].forEach((grant) => {
      if (handledResourceGrants.current.has(grant.nonce)) return;
      handledResourceGrants.current.add(grant.nonce);
      if (grant.targetId === multiplayer.localPlayerId) {
        const showWrenchInfo = grant.kind === 'wrench' && !game.hasSeenWrench;
        receiveResource(grant.kind);
        if (showWrenchInfo) setWrenchInfoOpen(true);
      }
    });
  }, [game.hasSeenWrench, multiplayer.localPlayerId, multiplayer.resourceGrants, multiplayer.worldTakes]);
  useEffect(() => {
    multiplayer.crateLootGrants.forEach((grant) => {
      if (handledCrateGrants.current.has(grant.nonce)) return;
      handledCrateGrants.current.add(grant.nonce);
      if (grant.targetId === multiplayer.localPlayerId) collectCrateLoot(grant.kind);
    });
  }, [multiplayer.crateLootGrants, multiplayer.localPlayerId]);
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
    if (multiplayer.isLeader) multiplayer.sendGame({ day: game.day, phase: game.phase, baseHealth: game.baseHealth, maxNights: game.maxNights, difficulty: game.difficulty, merchantVisits: game.merchantVisits, completionTime: game.completionTime, paused: isPaused });
    else if (multiplayer.sharedGame) {
      syncSharedGame(multiplayer.sharedGame);
      setIsPaused(multiplayer.sharedGame.paused);
    }
  }, [game.baseHealth, game.completionTime, game.day, game.difficulty, game.maxNights, game.merchantVisits, game.phase, isPaused, multiplayer.isLeader, multiplayer.sendGame, multiplayer.sharedGame, party, syncSharedGame]);
  useEffect(() => {
    if (!party || !multiplayer.isLeader || !multiplayer.stateRequest) return;
    multiplayer.sendGame({ day: game.day, phase: game.phase, baseHealth: game.baseHealth, maxNights: game.maxNights, difficulty: game.difficulty, merchantVisits: game.merchantVisits, completionTime: game.completionTime, paused: isPaused });
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
    if (party && !multiplayer.isLeader && game.baseHealth < MAX_BASE_HEALTH && game.wood >= repairWoodCost(game.weapon)) multiplayer.sendBaseRepair();
    repairBase();
  };
  const collectCrateLoot = (kind: CrateKind) => {
    const showWrenchInfo = kind === 'crate-wrench' && !game.hasSeenWrench;
    gatherCrateLoot(kind);
    if (showWrenchInfo) setWrenchInfoOpen(true);
  };
  const claimCrateLoot = (kind: CrateKind, playerId: string) => {
    if (party) multiplayer.grantCrateLoot(playerId, kind);
    else collectCrateLoot(kind);
  };
  const pauseFromMobile = () => {
    if (party && !multiplayer.isLeader) return;
    pauseClock();
    setIsPaused(true);
  };
  const interactionHandlers = { building: repairSharedBase, food: gatherFood, water: gatherWater, wrench: () => collectCrateLoot('crate-wrench') };
  const isFinished = game.phase === 'won' || game.phase === 'lost';
  return (
    <main className={`game-shell ${device === 'mobile' ? 'game-shell--mobile' : ''}`} style={device === 'mobile' ? { height: mobileHeight } : undefined}>
      {party && <PartyGameBadge code={party.code} players={multiplayer.memberCount} maxPlayers={party.maxPlayers} />}
      <GameWorld paused={isPaused} mobileMode={device === 'mobile'} playerNickname={playerNickname} phase={game.phase} day={game.day} difficulty={game.difficulty} baseHealth={game.baseHealth} maxNights={game.maxNights} playerHealth={game.playerHealth} weapon={game.weapon} hasSpear={game.hasSpear} hasAxe={game.hasAxe} hasSword={game.hasSword} merchantVisits={game.merchantVisits} wood={game.wood} onBuySpear={buySpear} onBuyAxe={buyAxe} onBuySword={buySword} interactionHandlers={interactionHandlers} onUnavailable={interactionUnavailable}
        multiplayerMode={Boolean(party)} localPlayerId={multiplayer.localPlayerId} onCrateClaim={claimCrateLoot}
        remotePlayers={multiplayer.players} onPlayerMove={sendPlayerPosition} onRevivePlayer={reviveTeammate} onPlayerAttack={multiplayer.sendPlayerAttack} onWorldHit={multiplayer.sendWorldHit} worldHits={multiplayer.worldHits}
        sharedWorld={multiplayer.sharedWorld} worldTakes={multiplayer.worldTakes} onWorldState={multiplayer.sendWorld} onWorldTake={(id) => {
          if (game.hasWrench && id.startsWith('wrench-drop-')) return;
          multiplayer.takeWorldObject(id);
        }}
        zombieDeath={multiplayer.zombieDeath} onZombieDeath={multiplayer.sendZombieDeath}
        onRemotePlayerDamage={multiplayer.damageRemotePlayer}
        authoritative={!party || multiplayer.isLeader} sharedZombies={multiplayer.zombies} zombieHit={multiplayer.zombieHit} onZombiesChange={multiplayer.sendZombies} onZombieHit={multiplayer.sendZombieHit}
        sharedDrops={multiplayer.drops} onTakeDrop={(drop) => {
          if ((drop.kind === 'spear' && game.hasSpear) || (drop.kind === 'wrench' && game.hasWrench)) return;
          multiplayer.takeResource(drop.id);
        }}
        onAttack={attack} onHarvest={gatherWood} onCrateLoot={collectCrateLoot}
        onPlayerDamage={(damage) => damagePlayer(damage, Boolean(party && multiplayer.memberCount > 1))} onBaseDamage={damageBase} onNightCleared={finishNight} />
      <InventoryPanel wood={game.wood} food={game.food} water={game.water} hasSpear={game.hasSpear} hasWrench={game.hasWrench} onEat={eatFood} onDrink={drinkWater} onDrop={party ? (kind) => {
        const hasItem = kind === 'spear' ? game.hasSpear : kind === 'wrench' ? game.hasWrench : game[kind] > 0;
        if (!hasItem) return;
        dropResource(kind);
        multiplayer.dropResource(kind);
      } : undefined} />
      {device === 'mobile' && <MobileControls enabled={!isPaused && !isFinished && !wrenchInfoOpen} canStartNight={game.phase === 'day'} canPause={!party || multiplayer.isLeader} onPause={pauseFromMobile} onStartNight={() => { if (party && !multiplayer.isLeader) multiplayer.sendStartNight(); else startNight(); }} />}
      {wrenchInfoOpen && <WrenchFoundScreen onClose={() => setWrenchInfoOpen(false)} />}
      {game.phase === 'won' && <VictoryScreen seconds={game.completionTime ?? 0} nights={game.maxNights} onRestart={returnToMenu} />}
      {game.phase === 'lost' && <DefeatScreen message={game.message} onRestart={returnToMenu} />}
      {isPaused && (party && !multiplayer.isLeader
        ? <PauseMenu locked />
        : <PauseMenu onContinue={() => { resumeClock(); setIsPaused(false); }} onEnd={() => { resumeClock(); setIsPaused(false); returnToMenu(); }} />)}
    </main>
  );
}
