import { useEffect, useRef } from 'react';
import { findNearestObject, INTERACTION_DISTANCE, type InteractableObject, type InteractionHandler } from '../interactions';
import type { Position } from '../../components/PlayerController';

interface Props {
  enabled: boolean;
  player: Position;
  buildings: InteractableObject[];
  onRepair: InteractionHandler;
  onUnavailable: () => void;
}

export function RepairSystem({ enabled, player, buildings, onRepair, onUnavailable }: Props) {
  const state = useRef({ player, buildings, onRepair, onUnavailable });
  state.current = { player, buildings, onRepair, onUnavailable };

  useEffect(() => {
    const handleRepair = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('.map-viewport')) return;
      event.preventDefault();
      if (!enabled || event.button !== 2) return;
      const nearest = findNearestObject(state.current.player, state.current.buildings);
      if (!nearest.object || nearest.distance > INTERACTION_DISTANCE) return state.current.onUnavailable();
      state.current.onRepair(nearest.object);
    };
    const stopMenu = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest('.map-viewport')) event.preventDefault();
    };
    window.addEventListener('mousedown', handleRepair);
    window.addEventListener('contextmenu', stopMenu);
    return () => {
      window.removeEventListener('mousedown', handleRepair);
      window.removeEventListener('contextmenu', stopMenu);
    };
  }, [enabled]);
  return null;
}
