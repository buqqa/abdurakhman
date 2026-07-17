import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Position } from '../components/PlayerController';
import type { GameState, Weapon } from './types';
import type { Zombie } from './zombies';

export interface RemotePlayer extends Position { id: string; nickname: string; weapon: Weapon; updatedAt: number }
interface PlayerPayload { id: string; nickname: string; x: number; y: number; weapon: Weapon }
export type SharedGame = Pick<GameState, 'day' | 'phase' | 'baseHealth' | 'maxNights' | 'difficulty' | 'merchantDay'>;
export type ResourceKind = 'wood' | 'food' | 'water';
export interface SharedDrop extends Position { id: string; kind: ResourceKind }

export function useMultiplayerRoom(code: string | undefined, nickname: string) {
  const id = useRef(crypto.randomUUID());
  const channelRef = useRef<ReturnType<typeof supabase.channel>>();
  const lastSent = useRef(0);
  const [players, setPlayers] = useState<RemotePlayer[]>([]);
  const [sharedGame, setSharedGame] = useState<SharedGame>();
  const [zombies, setZombies] = useState<Zombie[]>([]);
  const [zombieHit, setZombieHit] = useState<{ id: string; damage: number; nonce: string }>();
  const [drops, setDrops] = useState<SharedDrop[]>([]);
  const [stateRequest, setStateRequest] = useState(0);
  const lastPosition = useRef<Position>({ x: 100, y: 100 });

  useEffect(() => {
    if (!code) return;
    const channel = supabase.channel(`forest-party-${code}`);
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
    channel.subscribe((status) => { if (status === 'SUBSCRIBED') void channel.send({ type: 'broadcast', event: 'state-request', payload: {} }); });
    channelRef.current = channel;
    const removeStale = window.setInterval(() => setPlayers((current) => current.filter((player) => Date.now() - player.updatedAt < 4000)), 1000);
    return () => { window.clearInterval(removeStale); void supabase.removeChannel(channel); channelRef.current = undefined; };
  }, [code]);

  const sendPosition = useCallback((position: Position, weapon: Weapon) => {
    if (!channelRef.current || performance.now() - lastSent.current < 50) return;
    lastSent.current = performance.now();
    lastPosition.current = position;
    void channelRef.current.send({ type: 'broadcast', event: 'player-move', payload: { id: id.current, nickname, ...position, weapon } });
  }, [nickname]);

  const sendGame = useCallback((game: SharedGame) => {
    void channelRef.current?.send({ type: 'broadcast', event: 'game-state', payload: game });
  }, []);
  const sendZombies = useCallback((next: Zombie[]) => { setZombies(next); void channelRef.current?.send({ type: 'broadcast', event: 'zombie-state', payload: next }); }, []);
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

  return { players, sharedGame, zombies, zombieHit, drops, stateRequest, sendPosition, sendGame, sendZombies, sendZombieHit, dropResource, takeResource, sendDrops };
}
