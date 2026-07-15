import { useEffect, useRef } from 'react';

export interface MovementInput { x: number; y: number }

export function useMovementSystem(enabled: boolean) {
  const direction = useRef<MovementInput>({ x: 0, y: 0 });

  useEffect(() => {
    const pressed = new Set<string>();
    const updateDirection = () => {
      if (!enabled) return void (direction.current = { x: 0, y: 0 });
      direction.current = {
        x: Number(pressed.has('KeyD')) - Number(pressed.has('KeyA')),
        y: Number(pressed.has('KeyS')) - Number(pressed.has('KeyW')),
      };
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) event.preventDefault();
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
  }, [enabled]);

  return direction;
}
