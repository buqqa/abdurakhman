import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Position } from '../components/PlayerController';
import type { GameState, Weapon } from './types';
import type { Zombie } from './zombies';

export interface RemotePlayer extends Position { id: string; nickname: string; weapon: Weapon; health: number; downed: boolean; walking: boolean; attackNonce?: string; updatedAt: number }
interface PlayerPayload { id: string; nickname: string; x: number; y: number; weapon: Weapon; health: number; downed: boolean; walking: boolean }
interface PresencePayload { id: string; nickname: string; joinedAt: number }
export type SharedGame = Pick<GameState, 'day' | 'phase' | 'baseHealth' | 'maxNights' | 'difficulty' | 'merchantDay'>;
export type ResourceKind = 'wood' | 'food' | 'water';
export interface SharedDrop extends Position { id: string; kind: ResourceKind }
export interface WorldHit { id: string; hitsToFell: number; nonce: string }
export interface ZombieDeath { zombie: Zombie; nonce: string }

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
  const lastZombieSent = useRef(0);
  const latestZombies = useRef<Zombie[]>([]);
  const [players, setPlayers] = useState<RemotePlayer[]>([]);
  const [sharedGame, setSharedGame] = useState<SharedGame>();
  const [zombies, setZombies] = useState<Zombie[]>([]);
  const [zombieHit, setZombieHit] = useState<{ id: string; damage: number; nonce: string }>();
  const [drops, setDrops] = useState<SharedDrop[]>([]);
  const [stateRequest, setStateRequest] = useState(0);
  const [memberCount, setMemberCount] = useState(code ? 1 : 0);
  const [roomFull, setRoomFull] = useState(false);
  const [reviveSignal, setReviveSignal] = useState(0);
  const [worldHit, setWorldHit] = useState<WorldHit>();
  const [zombieDeath, setZombieDeath] = useState<ZombieDeath>();
  const lastPosition = useRef<Position>({ x: 100, y: 100 });

  useEffect(() => {
    if (!code) return;
    setRoomFull(false);
    const channel = supabase.channel(`forest-party-${code}`, { config: { presence: { key: id.current } } });
    channel.on('broadcast', { event: 'player-move' }, ({ payload }) => {
      const player = payload as PlayerPayload;
      if (player.id === id.current) return;
      setPlayers((current) => [...current.filter((item) => item.id !== player.id), { ...player, updatedAt: Date.now() }]);
    });
    channel.on('broadcast', { event: 'game-state' }, ({ payload }) => setSharedGame(payload as SharedGame));
    channel.on('broadcast', { event: 'zombie-state' }, ({ payload }) => setZombies(payload as Zombie[]));
    channel.on('broadcast', { event: 'zombie-hit' }, ({ payload }) => setZombieHit(payload as { id: string; damage: number; nonce: string }));
    channel.on('broadcast', { event: 'resource-drop' }, ({ payload }) => { const drop = payload as SharedDrop; setDrops((current) => [...current.filter((item) => item.id !== drop.id), drop]); });
    channel.on('broadcast', { event: 'resource-take' }, ({ payload }) => { const taken = payload as { id: string }; setDrops((current) => current.filter((item) => item.id !== taken.id)); });
    channel.on('broadcast', { event: 'resource-state' }, ({ payload }) => setDrops(payload as SharedDrop[]));
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
    channel.on('presence', { event: 'sync' }, () => {
      const members = Object.values(channel.presenceState()).flat() as unknown as PresencePayload[];
      const admitted = [...members].sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id)).slice(0, maxPlayers);
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
    const heartbeatDue = now - lastSent.current >= POSITION_HEARTBEAT;
    const walkingChanged = moved !== lastWalking.current;
    if (!channelRef.current || now - lastSent.current < POSITION_INTERVAL || (!moved && !walkingChanged && weapon === lastWeapon.current && health === lastHealth.current && !heartbeatDue)) return;
    lastSent.current = now;
    lastPosition.current = position;
    lastWeapon.current = weapon;
    lastHealth.current = health;
    lastWalking.current = moved;
    void channelRef.current.send({ type: 'broadcast', event: 'player-move', payload: { id: id.current, nickname, ...position, weapon, health, downed: health <= 0, walking: moved } });
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
    setDrops((current) => [...current, drop]);
    void channelRef.current?.send({ type: 'broadcast', event: 'resource-drop', payload: drop });
  }, []);
  const takeResource = useCallback((id: string) => {
    setDrops((current) => current.filter((item) => item.id !== id));
    void channelRef.current?.send({ type: 'broadcast', event: 'resource-take', payload: { id } });
  }, []);
  const sendDrops = useCallback((next: SharedDrop[]) => { void channelRef.current?.send({ type: 'broadcast', event: 'resource-state', payload: next }); }, []);
  const revivePlayer = useCallback((targetId: string) => {
    void channelRef.current?.send({ type: 'broadcast', event: 'player-revive', payload: { targetId } });
  }, []);
  const sendPlayerAttack = useCallback(() => {
    void channelRef.current?.send({ type: 'broadcast', event: 'player-attack', payload: { id: id.current, nonce: crypto.randomUUID() } });
  }, []);
  const sendWorldHit = useCallback((id: string, hitsToFell: number) => {
    void channelRef.current?.send({ type: 'broadcast', event: 'world-hit', payload: { id, hitsToFell, nonce: crypto.randomUUID() } });
  }, []);
  const sendZombieDeath = useCallback((zombie: Zombie) => {
    void channelRef.current?.send({ type: 'broadcast', event: 'zombie-death', payload: { zombie, nonce: crypto.randomUUID() } });
  }, []);

  return { players, sharedGame, zombies, zombieHit, zombieDeath, drops, stateRequest, memberCount, roomFull, reviveSignal, worldHit, sendPosition, sendGame, sendZombies, sendZombieHit, sendZombieDeath, dropResource, takeResource, sendDrops, revivePlayer, sendPlayerAttack, sendWorldHit };
}
