import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Position } from '../components/PlayerController';
import type { Weapon } from './types';
import type { Zombie } from './zombies';
import type { InteractableObject } from './interactions';
import type { PlayerPayload, PresencePayload, RemotePlayer, ResourceGrant, ResourceKind, SharedDrop, SharedGame, SharedWorld, WorldHit, WorldTake, ZombieDeath } from './multiplayerTypes';
export type { RemotePlayer, ResourceGrant, ResourceKind, SharedDrop, SharedGame, SharedWorld, WorldHit, WorldTake, ZombieDeath } from './multiplayerTypes';

const POSITION_INTERVAL = 66;
const POSITION_HEARTBEAT = 1000;
const ZOMBIE_INTERVAL = 100;

export function useMultiplayerRoom(code: string | undefined, nickname: string, maxPlayers = 3) {
  const id = useRef(crypto.randomUUID());
  const channelRef = useRef<ReturnType<typeof supabase.channel>>();
  const lastSent = useRef(0);
  const lastWeapon = useRef<Weapon>();
  const lastHealth = useRef(100);
  const lastWalking = useRef(false);
  const lastFacingRight = useRef(false);
  const lastZombieSent = useRef(0);
  const latestZombies = useRef<Zombie[]>([]);
  const latestWorld = useRef<SharedWorld>();
  const latestDrops = useRef<SharedDrop[]>([]);
  const isLeaderRef = useRef(false);
  const claimedWorld = useRef(new Set<string>());
  const claimedDrops = useRef(new Set<string>());
  const [players, setPlayers] = useState<RemotePlayer[]>([]);
  const [sharedGame, setSharedGame] = useState<SharedGame>();
  const [zombies, setZombies] = useState<Zombie[]>([]);
  const [zombieHit, setZombieHit] = useState<{ id: string; damage: number; nonce: string }>();
  const [drops, setDrops] = useState<SharedDrop[]>([]);
  const [stateRequest, setStateRequest] = useState(0);
  const [memberCount, setMemberCount] = useState(code ? 1 : 0);
  const [roomFull, setRoomFull] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  const [reviveSignal, setReviveSignal] = useState(0);
  const [worldHit, setWorldHit] = useState<WorldHit>();
  const [zombieDeath, setZombieDeath] = useState<ZombieDeath>();
  const [sharedWorld, setSharedWorld] = useState<SharedWorld>();
  const [worldTake, setWorldTake] = useState<WorldTake>();
  const [resourceGrant, setResourceGrant] = useState<ResourceGrant>();
  const [baseRepairSignal, setBaseRepairSignal] = useState(0);
  const [playerDamage, setPlayerDamage] = useState<{ damage: number; nonce: string }>();
  const lastPosition = useRef<Position>({ x: 100, y: 100 });

  useEffect(() => {
    isLeaderRef.current = false;
    setIsLeader(false);
    claimedWorld.current.clear();
    claimedDrops.current.clear();
    if (!code) return;
    setRoomFull(false);
    const channel = supabase.channel(`forest-party-${code}`, { config: { presence: { key: id.current } } });
    channel.on('broadcast', { event: 'player-move' }, ({ payload }) => {
      const player = payload as PlayerPayload;
      if (player.id === id.current) return;
      setPlayers((current) => {
        const existing = current.find((item) => item.id === player.id);
        return [...current.filter((item) => item.id !== player.id), { ...existing, ...player, updatedAt: Date.now() }];
      });
    });
    channel.on('broadcast', { event: 'game-state' }, ({ payload }) => setSharedGame(payload as SharedGame));
    channel.on('broadcast', { event: 'zombie-state' }, ({ payload }) => setZombies(payload as Zombie[]));
    channel.on('broadcast', { event: 'zombie-hit' }, ({ payload }) => setZombieHit(payload as { id: string; damage: number; nonce: string }));
    channel.on('broadcast', { event: 'resource-drop' }, ({ payload }) => { const drop = payload as SharedDrop; setDrops((current) => { const next = [...current.filter((item) => item.id !== drop.id), drop]; latestDrops.current = next; return next; }); });
    channel.on('broadcast', { event: 'resource-take' }, ({ payload }) => { const grant = payload as ResourceGrant; setDrops((current) => { const next = current.filter((item) => item.id !== grant.id); latestDrops.current = next; return next; }); setResourceGrant(grant); });
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
    channel.on('broadcast', { event: 'world-hit' }, ({ payload }) => setWorldHit(payload as WorldHit));
    channel.on('broadcast', { event: 'zombie-death' }, ({ payload }) => setZombieDeath(payload as ZombieDeath));
    channel.on('broadcast', { event: 'world-state' }, ({ payload }) => { const next = payload as SharedWorld; latestWorld.current = next; setSharedWorld(next); });
    channel.on('broadcast', { event: 'world-take' }, ({ payload }) => {
      const grant = payload as WorldTake;
      if (latestWorld.current) latestWorld.current = { ...latestWorld.current, objects: latestWorld.current.objects.filter((item) => item.id !== grant.id) };
      setWorldTake(grant);
    });
    channel.on('broadcast', { event: 'world-take-request' }, ({ payload }) => {
      if (!isLeaderRef.current) return;
      const request = payload as { id: string; targetId: string };
      const object = latestWorld.current?.objects.find((item) => item.id === request.id);
      if (!object || (object.kind !== 'food' && object.kind !== 'water') || claimedWorld.current.has(object.id)) return;
      claimedWorld.current.add(object.id);
      const grant: WorldTake = { id: object.id, kind: object.kind, targetId: request.targetId, nonce: crypto.randomUUID() };
      latestWorld.current = { ...latestWorld.current!, objects: latestWorld.current!.objects.filter((item) => item.id !== object.id) };
      setWorldTake(grant);
      void channel.send({ type: 'broadcast', event: 'world-take', payload: grant });
    });
    channel.on('broadcast', { event: 'base-repair' }, () => { if (isLeaderRef.current) setBaseRepairSignal((value) => value + 1); });
    channel.on('broadcast', { event: 'player-damage' }, ({ payload }) => {
      const hit = payload as { targetId: string; damage: number; nonce: string };
      if (hit.targetId === id.current) setPlayerDamage({ damage: hit.damage, nonce: hit.nonce });
    });
    channel.on('presence', { event: 'sync' }, () => {
      const members = Object.values(channel.presenceState()).flat() as unknown as PresencePayload[];
      const admitted = [...members].sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id)).slice(0, maxPlayers);
      const leader = admitted[0]?.id === id.current;
      isLeaderRef.current = leader;
      setIsLeader(leader);
      const admittedIds = new Set(admitted.map((member) => member.id));
      setPlayers((current) => current.filter((player) => admittedIds.has(player.id)));
      setMemberCount(Math.min(members.length, maxPlayers));
      setRoomFull(members.length > maxPlayers && !admitted.some((member) => member.id === id.current));
    });
    channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED') return;
      void channel.track({ id: id.current, nickname, joinedAt: Date.now() });
      void channel.send({ type: 'broadcast', event: 'state-request', payload: {} });
    });
    channelRef.current = channel;
    const removeStale = window.setInterval(() => setPlayers((current) => current.filter((player) => Date.now() - player.updatedAt < 4000)), 1000);
    return () => { window.clearInterval(removeStale); void supabase.removeChannel(channel); channelRef.current = undefined; };
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
    setResourceGrant(grant);
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
    void channelRef.current?.send({ type: 'broadcast', event: 'world-hit', payload: { object, hitsToBreak, nonce: crypto.randomUUID() } });
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
    setWorldTake(grant);
    void channel.send({ type: 'broadcast', event: 'world-take', payload: grant });
  }, []);
  const sendBaseRepair = useCallback(() => { void channelRef.current?.send({ type: 'broadcast', event: 'base-repair', payload: {} }); }, []);
  const damageRemotePlayer = useCallback((targetId: string, damage: number) => {
    void channelRef.current?.send({ type: 'broadcast', event: 'player-damage', payload: { targetId, damage, nonce: crypto.randomUUID() } });
  }, []);

  return { localPlayerId: id.current, isLeader, players, sharedGame, sharedWorld, worldTake, resourceGrant, baseRepairSignal, playerDamage, zombies, zombieHit, zombieDeath, drops, stateRequest, memberCount, roomFull, reviveSignal, worldHit, sendPosition, sendGame, sendWorld, sendZombies, sendZombieHit, sendZombieDeath, dropResource, takeResource, takeWorldObject, sendBaseRepair, damageRemotePlayer, sendDrops, revivePlayer, sendPlayerAttack, sendWorldHit };
}
