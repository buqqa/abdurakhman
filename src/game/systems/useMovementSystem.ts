import { useEffect, useRef } from 'react';
import { useControls } from '../controls';

export interface MovementInput { x: number; y: number }

export function useMovementSystem(enabled: boolean) {
  const { bindings } = useControls();
  const direction = useRef<MovementInput>({ x: 0, y: 0 });

  useEffect(() => {
    const pressed = new Set<string>();
    const updateDirection = () => {
      if (!enabled) return void (direction.current = { x: 0, y: 0 });
      direction.current = {
        x: Number(pressed.has(bindings.right)) - Number(pressed.has(bindings.left)),
        y: Number(pressed.has(bindings.down)) - Number(pressed.has(bindings.up)),
      };
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if ([bindings.up, bindings.down, bindings.left, bindings.right].includes(event.code)) event.preventDefault();
      pressed.add(event.code);
      updateDirection();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      pressed.delete(event.code);
      updateDirection();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [bindings, enabled]);

  return direction;
}
