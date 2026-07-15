import { useEffect, useRef } from 'react';
import type { Position } from '../../components/PlayerController';

interface Props { enabled: boolean; player: Position; onBuild: (position: Position) => void }

export function BuildSystem({ enabled, player, onBuild }: Props) {
  const state = useRef({ player, onBuild });
  state.current = { player, onBuild };

  useEffect(() => {
    const handleBuild = (event: KeyboardEvent) => {
      if (!enabled || event.code !== 'KeyF' || event.repeat) return;
      event.preventDefault();
      state.current.onBuild({ x: state.current.player.x, y: state.current.player.y });
    };
    window.addEventListener('keydown', handleBuild);
    return () => window.removeEventListener('keydown', handleBuild);
  }, [enabled]);
  return null;
}
