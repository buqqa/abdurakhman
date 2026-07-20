import { useEffect, useRef } from 'react';
import { findNearestObject, INTERACTION_DISTANCE, type InteractableObject, type InteractionHandlers } from '../interactions';
import type { Position } from '../../components/PlayerController';
import { useControls } from '../controls';

interface Props {
  enabled: boolean;
  player: Position;
  objects: InteractableObject[];
  handlers: InteractionHandlers;
  onUnavailable: () => void;
  onInteracted?: (object: InteractableObject) => void;
}

export function InteractionSystem({ enabled, player, objects, handlers, onUnavailable, onInteracted }: Props) {
  const { bindings } = useControls();
  const state = useRef({ player, objects, handlers, onUnavailable, onInteracted });
  state.current = { player, objects, handlers, onUnavailable, onInteracted };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!enabled || event.code !== bindings.interact || event.repeat) return;
      const nearest = findNearestObject(state.current.player, state.current.objects);
      if (!nearest.object || nearest.distance > INTERACTION_DISTANCE) return state.current.onUnavailable();
      const handler = state.current.handlers[nearest.object.kind];
      if (!handler) return state.current.onUnavailable();
      handler(nearest.object);
      state.current.onInteracted?.(nearest.object);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [bindings.interact, enabled]);
  return null;
}
