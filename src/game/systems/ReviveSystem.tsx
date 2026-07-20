import { useEffect, useRef } from 'react';
import type { RemotePlayer } from '../multiplayer';
import type { Position } from '../../components/PlayerController';
import { useControls } from '../controls';

const REVIVE_DISTANCE = 80;

interface Props {
  enabled: boolean;
  player: Position;
  teammates: RemotePlayer[];
  onRevive: (playerId: string) => void;
}

export function ReviveSystem({ enabled, player, teammates, onRevive }: Props) {
  const { bindings } = useControls();
  const state = useRef({ enabled, player, teammates, onRevive });
  const lastAttempt = useRef(0);
  state.current = { enabled, player, teammates, onRevive };

  useEffect(() => {
    const handleRevive = (event: KeyboardEvent) => {
      if (event.code !== bindings.revive || event.repeat || !state.current.enabled || performance.now() - lastAttempt.current < 1200) return;
      const target = state.current.teammates
        .filter((teammate) => teammate.downed)
        .map((teammate) => ({ teammate, distance: Math.hypot(teammate.x - state.current.player.x, teammate.y - state.current.player.y) }))
        .filter(({ distance }) => distance <= REVIVE_DISTANCE)
        .sort((a, b) => a.distance - b.distance)[0];
      if (target) {
        lastAttempt.current = performance.now();
        state.current.onRevive(target.teammate.id);
      }
    };
    window.addEventListener('keydown', handleRevive);
    return () => window.removeEventListener('keydown', handleRevive);
  }, [bindings.revive]);

  return null;
}
