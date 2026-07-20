import { useEffect, useRef } from 'react';
import { HARVEST_DISTANCE, type InteractableObject, type InteractionHandler } from '../interactions';
import { PLAYER_SIZE } from '../mapConfig';
import type { Position } from '../../components/PlayerController';
import { useControls } from '../controls';
import { DEFAULT_ATTACK_COOLDOWN } from '../config';

interface Props {
  enabled: boolean;
  player: Position;
  targets: InteractableObject[];
  onHit: InteractionHandler;
  onMiss: () => void;
  attackDistance?: number;
  cooldown?: number;
}

export function AttackSystem({ enabled, player, targets, onHit, onMiss, attackDistance = HARVEST_DISTANCE, cooldown = DEFAULT_ATTACK_COOLDOWN }: Props) {
  const { bindings } = useControls();
  const state = useRef({ player, targets, onHit, onMiss, attackDistance, cooldown });
  const lastAttack = useRef(0);
  state.current = { player, targets, onHit, onMiss, attackDistance, cooldown };

  useEffect(() => {
    const attack = () => {
      if (!enabled) return;
      const now = performance.now();
      if (now - lastAttack.current < state.current.cooldown) return;
      lastAttack.current = now;
      const playerCenter = { x: state.current.player.x + PLAYER_SIZE / 2, y: state.current.player.y + PLAYER_SIZE / 2 };
      const target = state.current.targets.reduce<{ object?: InteractableObject; distance: number }>((nearest, object) => {
        const distance = Math.hypot(object.x - playerCenter.x, object.y - playerCenter.y);
        return distance <= state.current.attackDistance && distance < nearest.distance ? { object, distance } : nearest;
      }, { distance: Number.POSITIVE_INFINITY });
      if (!target.object) return state.current.onMiss();
      state.current.onHit(target.object);
    };
    const handlePointer = (event: PointerEvent) => {
      if (!event.isPrimary || bindings.attack !== `Mouse${event.button}` || !(event.target as HTMLElement).closest('.map-viewport')) return;
      event.preventDefault();
      attack();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.repeat || event.code !== bindings.attack) return;
      event.preventDefault();
      attack();
    };
    window.addEventListener('pointerdown', handlePointer);
    window.addEventListener('keydown', handleKey);
    return () => { window.removeEventListener('pointerdown', handlePointer); window.removeEventListener('keydown', handleKey); };
  }, [bindings.attack, enabled]);
  return null;
}
