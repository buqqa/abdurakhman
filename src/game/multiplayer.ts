import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Position } from '../components/PlayerController';
import type { Weapon } from './types';
import type { Zombie } from './zombies';
import type { InteractableObject } from './interactions';
import type { CrateLootGrant, PlayerPayload, PresencePayload, RemotePlayer, ResourceGrant, ResourceKind, SharedDrop, SharedGame, SharedWorld, WorldHit, WorldTake, ZombieDamageState, ZombieDeath } from './multiplayerTypes';
export type { CrateLootGrant, RemotePlayer, ResourceGrant, ResourceKind, SharedDrop, SharedGame, SharedWorld, WorldHit, WorldTake, ZombieDeath } from './multiplayerTypes';

const POSITION_INTERVAL = 80;
const PLAYER_UPDATE_INTERVAL = 50;
const POSITION_HEARTBEAT = 1000;
const ZOMBIE_INTERVAL = 100;

export function useMultiplayerRoom(code: string | undefined, nickname: string, maxPlayers = 4) {
  const id = useRef(crypto.randomUUID());
  const channelRef = useRef<ReturnType<typeof supabase.channel>>();
  const lastSent = useRef(0);
  const lastWeapon = useRef<Weapon>();
  const lastHealth = useRef(100);
  const lastWalking = useRef(false);
  const lastFacingRight = useRef(false);
  const lastZombieSent = useRef(0);
  const pendingPlayers = useRef(new Map<string, PlayerPayload>());
  const playerFlushTimer = useRef<number>();
  const latestZombies = useRef<Zombie[]>([]);
  const latestWorld = useRef<SharedWorld>();
  const latestDrops = useRef<SharedDrop[]>([]);
  const isLeaderRef = useRef(false);
  const admittedPlayerIds = useRef(new Set<string>());
  const claimedWorld = useRef(new Set<string>());
  const claimedDrops = useRef(new Set<string>());
  const [players, setPlayers] = useState<RemotePlayer[]>([]);
  const [sharedGame, setSharedGame] = useState<SharedGame>();
  const [zombies, setZombies] = useState<Zombie[]>([]);
  const [zombieHit, setZombieHit] = useState<ZombieDamageState>({ sequence: 0, totals: {} });
  const [drops, setDrops] = useState<SharedDrop[]>([]);
  const [stateRequest, setStateRequest] = useState(0);
  const [memberCount, setMemberCount] = useState(code ? 1 : 0);
  const [roomFull, setRoomFull] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  const [reviveSignal, setReviveSignal] = useState(0);
  const [worldHits, setWorldHits] = useState<WorldHit[]>([]);
  const [crateLootGrants, setCrateLootGrants] = useState<CrateLootGrant[]>([]);
  const [zombieDeath, setZombieDeath] = useState<ZombieDeath>();
  const [sharedWorld, setSharedWorld] = useState<SharedWorld>();
  const [worldTakes, setWorldTakes] = useState<WorldTake[]>([]);
  const [resourceGrants, setResourceGrants] = useState<ResourceGrant[]>([]);
  const [baseRepairSignal, setBaseRepairSignal] = useState(0);
  const [startNightSignal, setStartNightSignal] = useState(0);
  const [playerDamageTotal, setPlayerDamageTotal] = useState(0);
  const lastPosition = useRef<Position>({ x: 100, y: 100 });

  useEffect(() => {
    isLeaderRef.current = false;
    admittedPlayerIds.current.clear();
    setIsLeader(false);
    claimedWorld.current.clear();
    claimedDrops.current.clear();
    pendingPlayers.current.clear();
    latestZombies.current = [];
    latestWorld.current = undefined;
    latestDrops.current = [];
    setPlayers([]);
    setSharedGame(undefined);
    setSharedWorld(undefined);
    setZombies([]);
    setDrops([]);
    setZombieDeath(undefined);
    setWorldHits([]);
    setWorldTakes([]);
    setResourceGrants([]);
    setCrateLootGrants([]);
    setStateRequest(0);
    setReviveSignal(0);
    setBaseRepairSignal(0);
    setStartNightSignal(0);
    setMemberCount(code ? 1 : 0);
    if (!code) return;
    setRoomFull(false);
    setPlayerDamageTotal(0);
    setZombieHit({ sequence: 0, totals: {} });
    const channel = supabase.channel(`forest-party-${code}`, { config: { presence: { key: id.current } } });
    channel.on('broadcast', { event: 'player-move' }, ({ payload }) => {
      const player = payload as PlayerPayload;
      if (player.id === id.current || !admittedPlayerIds.current.has(player.id)) return;
      pendingPlayers.current.set(player.id, player);
      if (playerFlushTimer.current !== undefined) return;
      playerFlushTimer.current = window.setTimeout(() => {
        const updates = new Map(pendingPlayers.current);
        pendingPlayers.current.clear();
        playerFlushTimer.current = undefined;
        const updatedAt = Date.now();
        setPlayers((current) => {
          const next = current.map((existing) => updates.has(existing.id)
            ? { ...existing, ...updates.get(existing.id)!, updatedAt }
            : existing);
          const known = new Set(current.map((existing) => existing.id));
          updates.forEach((update) => { if (!known.has(update.id)) next.push({ ...update, updatedAt }); });
          return next;
        });
      }, PLAYER_UPDATE_INTERVAL);
    });
    channel.on('broadcast', { event: 'game-state' }, ({ payload }) => setSharedGame(payload as SharedGame));
    channel.on('broadcast', { event: 'zombie-state' }, ({ payload }) => setZombies(payload as Zombie[]));
    channel.on('broadcast', { event: 'zombie-hit' }, ({ payload }) => {
      const hit = payload as { id: string; damage: number };
      setZombieHit((current) => ({ sequence: current.sequence + 1, totals: { ...current.totals, [hit.id]: (current.totals[hit.id] ?? 0) + hit.damage } }));
    });
    channel.on('broadcast', { event: 'resource-drop' }, ({ payload }) => { const drop = payload as SharedDrop; setDrops((current) => { const next = [...current.filter((item) => item.id !== drop.id), drop]; latestDrops.current = next; return next; }); });
    channel.on('broadcast', { event: 'resource-take' }, ({ payload }) => { const grant = payload as ResourceGrant; setDrops((current) => { const next = current.filter((item) => item.id !== grant.id); latestDrops.current = next; return next; }); setResourceGrants((current) => [...current.slice(-63), grant]); });
    channel.on('broadcast', { event: 'resource-take-request' }, ({ payload }) => {
      if (!isLeaderRef.current) return;
      const request = payload as { id: string; targetId: string };
      const drop = latestDrops.current.find((item) => item.id === request.id);
      if (!drop || claimedDrops.current.has(drop.id)) return;
      claimedDrops.current.add(drop.id);
      const grant: ResourceGrant = { ...drop, targetId: request.targetId, nonce: crypto.randomUUID() };
      setDrops((current) => { const next = current.filter((item) => item.id !== drop.id); latestDrops.current = next; return next; });
      void channel.send({ type: 'broadcast', event: 'resource-take', payload: grant });
    });
    channel.on('broadcast', { event: 'resource-state' }, ({ payload }) => { const next = payload as SharedDrop[]; latestDrops.current = next; setDrops(next); });
    channel.on('broadcast', { event: 'state-request' }, () => setStateRequest((value) => value + 1));
    channel.on('broadcast', { event: 'player-revive' }, ({ payload }) => {
      if ((payload as { targetId: string }).targetId === id.current) setReviveSignal((value) => value + 1);
    });
    channel.on('broadcast', { event: 'player-attack' }, ({ payload }) => {
      const action = payload as { id: string; nonce: string };
      setPlayers((current) => current.map((player) => player.id === action.id ? { ...player, attackNonce: action.nonce } : player));
    });
    channel.on('broadcast', { event: 'world-hit' }, ({ payload }) => setWorldHits((current) => [...current.slice(-63), payload as WorldHit]));
    channel.on('broadcast', { event: 'crate-loot-grant' }, ({ payload }) => setCrateLootGrants((current) => [...current.slice(-63), payload as CrateLootGrant]));
    channel.on('broadcast', { event: 'zombie-death' }, ({ payload }) => setZombieDeath(payload as ZombieDeath));
    channel.on('broadcast', { event: 'world-state' }, ({ payload }) => { const next = payload as SharedWorld; latestWorld.current = next; setSharedWorld(next); });
    channel.on('broadcast', { event: 'world-take' }, ({ payload }) => {
      const grant = payload as WorldTake;
      if (latestWorld.current) latestWorld.current = { ...latestWorld.current, objects: latestWorld.current.objects.filter((item) => item.id !== grant.id) };
      setWorldTakes((current) => [...current.slice(-63), grant]);
    });
    channel.on('broadcast', { event: 'world-take-request' }, ({ payload }) => {
      if (!isLeaderRef.current) return;
      const request = payload as { id: string; targetId: string };
      const object = latestWorld.current?.objects.find((item) => item.id === request.id);
      if (!object || (object.kind !== 'food' && object.kind !== 'water') || claimedWorld.current.has(object.id)) return;
      claimedWorld.current.add(object.id);
      const grant: WorldTake = { id: object.id, kind: object.kind, targetId: request.targetId, nonce: crypto.randomUUID() };
      latestWorld.current = { ...latestWorld.current!, objects: latestWorld.current!.objects.filter((item) => item.id !== object.id) };
      setWorldTakes((current) => [...current.slice(-63), grant]);
      void channel.send({ type: 'broadcast', event: 'world-take', payload: grant });
    });
    channel.on('broadcast', { event: 'base-repair' }, () => { if (isLeaderRef.current) setBaseRepairSignal((value) => value + 1); });
    channel.on('broadcast', { event: 'start-night' }, () => { if (isLeaderRef.current) setStartNightSignal((value) => value + 1); });
    channel.on('broadcast', { event: 'player-damage' }, ({ payload }) => {
      const hit = payload as { targetId: string; damage: number; nonce: string };
      if (hit.targetId === id.current) setPlayerDamageTotal((total) => total + hit.damage);
    });
    channel.on('presence', { event: 'sync' }, () => {
      const members = Object.values(channel.presenceState()).flat() as unknown as PresencePayload[];
      const admitted = [...members].sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id)).slice(0, maxPlayers);
      const leader = admitted[0]?.id === id.current;
      isLeaderRef.current = leader;
      setIsLeader(leader);
      const admittedIds = new Set(admitted.map((member) => member.id));
      admittedPlayerIds.current = admittedIds;
      pendingPlayers.current.forEach((_, playerId) => {
        if (!admittedIds.has(playerId)) pendingPlayers.current.delete(playerId);
      });
      setPlayers((current) => {
        const filtered = current.filter((player) => admittedIds.has(player.id));
        return filtered.length === current.length ? current : filtered;
      });
      setMemberCount(Math.min(members.length, maxPlayers));
      setRoomFull(members.length > maxPlayers && !admitted.some((member) => member.id === id.current));
    });
    channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED') return;
      void channel.track({ id: id.current, nickname, joinedAt: Date.now() });
      void channel.send({ type: 'broadcast', event: 'state-request', payload: {} });
    });
    channelRef.current = channel;
    const removeStale = window.setInterval(() => setPlayers((current) => {
      const active = current.filter((player) => Date.now() - player.updatedAt < 4000 && admittedPlayerIds.current.has(player.id));
      return active.length === current.length ? current : active;
    }), 1000);
    return () => {
      window.clearInterval(removeStale);
      if (playerFlushTimer.current !== undefined) window.clearTimeout(playerFlushTimer.current);
      playerFlushTimer.current = undefined;
      pendingPlayers.current.clear();
      admittedPlayerIds.current.clear();
      void supabase.removeChannel(channel);
      channelRef.current = undefined;
    };
  }, [code, maxPlayers, nickname]);

  const sendPosition = useCallback((position: Position, weapon: Weapon, health: number) => {
    const now = performance.now();
    const moved = Math.hypot(position.x - lastPosition.current.x, position.y - lastPosition.current.y) >= 2;
    const horizontalMove = position.x - lastPosition.current.x;
    if (Math.abs(horizontalMove) >= 1) lastFacingRight.current = horizontalMove > 0;
    const heartbeatDue = now - lastSent.current >= POSITION_HEARTBEAT;
    const walkingChanged = moved !== lastWalking.current;
    if (!channelRef.current || now - lastSent.current < POSITION_INTERVAL || (!moved && !walkingChanged && weapon === lastWeapon.current && health === lastHealth.current && !heartbeatDue)) return;
    lastSent.current = now;
    lastPosition.current = position;
    lastWeapon.current = weapon;
    lastHealth.current = health;
    lastWalking.current = moved;
    void channelRef.current.send({ type: 'broadcast', event: 'player-move', payload: { id: id.current, nickname, ...position, weapon, health, downed: health <= 0, walking: moved, facingRight: lastFacingRight.current } });
  }, [nickname]);

  const sendGame = useCallback((game: SharedGame) => {
    void channelRef.current?.send({ type: 'broadcast', event: 'game-state', payload: game });
  }, []);
  const sendZombies = useCallback((next?: Zombie[]) => {
    if (next) latestZombies.current = next;
    const now = performance.now();
    if (next && now - lastZombieSent.current < ZOMBIE_INTERVAL) return;
    lastZombieSent.current = now;
    void channelRef.current?.send({ type: 'broadcast', event: 'zombie-state', payload: latestZombies.current });
  }, []);
  const sendZombieHit = useCallback((id: string, damage: number) => { void channelRef.current?.send({ type: 'broadcast', event: 'zombie-hit', payload: { id, damage, nonce: crypto.randomUUID() } }); }, []);
  const dropResource = useCallback((kind: ResourceKind) => {
    const drop = { id: crypto.randomUUID(), kind, x: lastPosition.current.x + 28, y: lastPosition.current.y + 22 };
    setDrops((current) => { const next = [...current, drop]; latestDrops.current = next; return next; });
    void channelRef.current?.send({ type: 'broadcast', event: 'resource-drop', payload: drop });
  }, []);
  const takeResource = useCallback((dropId: string) => {
    const channel = channelRef.current;
    if (!channel) return;
    if (!isLeaderRef.current) return void channel.send({ type: 'broadcast', event: 'resource-take-request', payload: { id: dropId, targetId: id.current } });
    const drop = latestDrops.current.find((item) => item.id === dropId);
    if (!drop || claimedDrops.current.has(dropId)) return;
    claimedDrops.current.add(dropId);
    const grant: ResourceGrant = { ...drop, targetId: id.current, nonce: crypto.randomUUID() };
    setDrops((current) => { const next = current.filter((item) => item.id !== dropId); latestDrops.current = next; return next; });
    setResourceGrants((current) => [...current.slice(-63), grant]);
    void channel.send({ type: 'broadcast', event: 'resource-take', payload: grant });
  }, []);
  const sendDrops = useCallback((next: SharedDrop[]) => { latestDrops.current = next; void channelRef.current?.send({ type: 'broadcast', event: 'resource-state', payload: next }); }, []);
  const revivePlayer = useCallback((targetId: string) => {
    void channelRef.current?.send({ type: 'broadcast', event: 'player-revive', payload: { targetId } });
  }, []);
  const sendPlayerAttack = useCallback(() => {
    void channelRef.current?.send({ type: 'broadcast', event: 'player-attack', payload: { id: id.current, nonce: crypto.randomUUID() } });
  }, []);
  const sendWorldHit = useCallback((object: InteractableObject, hitsToBreak: number) => {
    void channelRef.current?.send({ type: 'broadcast', event: 'world-hit', payload: { object, hitsToBreak, playerId: id.current, nonce: crypto.randomUUID() } });
  }, []);
  const grantCrateLoot = useCallback((targetId: string, kind: CrateLootGrant['kind']) => {
    const grant = { targetId, kind, nonce: crypto.randomUUID() };
    if (targetId === id.current) setCrateLootGrants((current) => [...current.slice(-63), grant]);
    void channelRef.current?.send({ type: 'broadcast', event: 'crate-loot-grant', payload: grant });
  }, []);
  const sendZombieDeath = useCallback((zombie: Zombie) => {
    void channelRef.current?.send({ type: 'broadcast', event: 'zombie-death', payload: { zombie, nonce: crypto.randomUUID() } });
  }, []);
  const sendWorld = useCallback((next?: SharedWorld) => {
    if (next) latestWorld.current = next;
    if (latestWorld.current) void channelRef.current?.send({ type: 'broadcast', event: 'world-state', payload: latestWorld.current });
  }, []);
  const takeWorldObject = useCallback((objectId: string) => {
    const channel = channelRef.current;
    if (!channel) return;
    if (!isLeaderRef.current) return void channel.send({ type: 'broadcast', event: 'world-take-request', payload: { id: objectId, targetId: id.current } });
    const object = latestWorld.current?.objects.find((item) => item.id === objectId);
    if (!object || (object.kind !== 'food' && object.kind !== 'water') || claimedWorld.current.has(objectId)) return;
    claimedWorld.current.add(objectId);
    const grant: WorldTake = { id: objectId, kind: object.kind, targetId: id.current, nonce: crypto.randomUUID() };
    latestWorld.current = { ...latestWorld.current!, objects: latestWorld.current!.objects.filter((item) => item.id !== objectId) };
    setWorldTakes((current) => [...current.slice(-63), grant]);
    void channel.send({ type: 'broadcast', event: 'world-take', payload: grant });
  }, []);
  const sendBaseRepair = useCallback(() => { void channelRef.current?.send({ type: 'broadcast', event: 'base-repair', payload: {} }); }, []);
  const sendStartNight = useCallback(() => { void channelRef.current?.send({ type: 'broadcast', event: 'start-night', payload: {} }); }, []);
  const damageRemotePlayer = useCallback((targetId: string, damage: number) => {
    void channelRef.current?.send({ type: 'broadcast', event: 'player-damage', payload: { targetId, damage, nonce: crypto.randomUUID() } });
  }, []);

  return { localPlayerId: id.current, isLeader, players, sharedGame, sharedWorld, worldTakes, resourceGrants, crateLootGrants, baseRepairSignal, startNightSignal, playerDamageTotal, zombies, zombieHit, zombieDeath, drops, stateRequest, memberCount, roomFull, reviveSignal, worldHits, sendPosition, sendGame, sendWorld, sendZombies, sendZombieHit, sendZombieDeath, dropResource, takeResource, takeWorldObject, sendBaseRepair, sendStartNight, damageRemotePlayer, sendDrops, revivePlayer, sendPlayerAttack, sendWorldHit, grantCrateLoot };
}
