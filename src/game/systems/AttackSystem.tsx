import { useEffect, useRef } from 'react';
import { HARVEST_DISTANCE, type InteractableObject, type InteractionHandler } from '../interactions';
import { PLAYER_SIZE } from '../mapConfig';
import type { Position } from '../../components/PlayerController';

interface Props {
  enabled: boolean;
  player: Position;
  targets: InteractableObject[];
  onHit: InteractionHandler;
  onMiss: () => void;
}

export function AttackSystem({ enabled, player, targets, onHit, onMiss }: Props) {
  const state = useRef({ player, targets, onHit, onMiss });
  const lastAttack = useRef(0);
  state.current = { player, targets, onHit, onMiss };

  useEffect(() => {
    const handleAttack = (event: PointerEvent) => {
      if (!enabled || !event.isPrimary || event.button !== 0 || !(event.target as HTMLElement).closest('.map-viewport')) return;
      event.preventDefault();
      const now = performance.now();
      if (now - lastAttack.current < 450) return;
      lastAttack.current = now;
      const playerCenter = { x: state.current.player.x + PLAYER_SIZE / 2, y: state.current.player.y + PLAYER_SIZE / 2 };
      const target = state.current.targets.reduce<{ object?: InteractableObject; distance: number }>((nearest, object) => {
        const distance = Math.hypot(object.x - playerCenter.x, object.y - playerCenter.y);
        return distance <= HARVEST_DISTANCE && distance < nearest.distance ? { object, distance } : nearest;
      }, { distance: Number.POSITIVE_INFINITY });
      if (!target.object) return state.current.onMiss();
      state.current.onHit(target.object);
    };
    window.addEventListener('pointerdown', handleAttack);
    return () => window.removeEventListener('pointerdown', handleAttack);
  }, [enabled]);
  return null;
}
