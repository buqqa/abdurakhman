import { useEffect, useRef } from 'react';
import { findNearestObject, INTERACTION_DISTANCE, type InteractableObject, type InteractionHandler } from '../interactions';
import type { Position } from '../../components/PlayerController';
import { useControls } from '../controls';

interface Props {
  enabled: boolean;
  player: Position;
  buildings: InteractableObject[];
  onRepair: InteractionHandler;
  onUnavailable: () => void;
}

export function RepairSystem({ enabled, player, buildings, onRepair, onUnavailable }: Props) {
  const { bindings } = useControls();
  const state = useRef({ player, buildings, onRepair, onUnavailable });
  state.current = { player, buildings, onRepair, onUnavailable };

  useEffect(() => {
    const repair = () => {
      if (!enabled) return;
      const nearest = findNearestObject(state.current.player, state.current.buildings);
      if (!nearest.object || nearest.distance > INTERACTION_DISTANCE) return state.current.onUnavailable();
      state.current.onRepair(nearest.object);
    };
    const handleRepair = (event: MouseEvent) => {
      if (bindings.repair !== `Mouse${event.button}` || !(event.target as HTMLElement).closest('.map-viewport')) return;
      event.preventDefault();
      repair();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.repeat || event.code !== bindings.repair) return;
      event.preventDefault();
      repair();
    };
    const stopMenu = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest('.map-viewport')) event.preventDefault();
    };
    window.addEventListener('mousedown', handleRepair);
    window.addEventListener('keydown', handleKey);
    window.addEventListener('contextmenu', stopMenu);
    return () => {
      window.removeEventListener('mousedown', handleRepair);
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('contextmenu', stopMenu);
    };
  }, [bindings.repair, enabled]);
  return null;
}
