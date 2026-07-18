import { useCallback, useEffect, useRef, useState } from 'react';
import type { RemotePlayer } from '../multiplayer';
import type { Position } from '../../components/PlayerController';

export interface Footprint extends Position { id: number }

export function useFootprints(remotePlayers: RemotePlayer[]) {
  const [footprints, setFootprints] = useState<Footprint[]>([]);
  const nextId = useRef(0);
  const remoteState = useRef<Record<string, { position: Position; at: number }>>({});
  const addFootprint = useCallback((position: Position) => {
    const footprint = { ...position, id: nextId.current++ };
    setFootprints((current) => [...current, footprint]);
    window.setTimeout(() => setFootprints((current) => current.filter((item) => item.id !== footprint.id)), 1000);
  }, []);

  useEffect(() => {
    const now = performance.now();
    remotePlayers.forEach((remote) => {
      const previous = remoteState.current[remote.id];
      const moved = previous && Math.hypot(remote.x - previous.position.x, remote.y - previous.position.y) > 3;
      if (moved && remote.walking && !remote.downed && now - previous.at >= 230) {
        addFootprint(remote);
        remoteState.current[remote.id] = { position: remote, at: now };
      } else if (!previous || !remote.walking) remoteState.current[remote.id] = { position: remote, at: previous?.at ?? now };
    });
  }, [addFootprint, remotePlayers]);

  return { footprints, addFootprint };
}
