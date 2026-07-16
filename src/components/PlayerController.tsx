import { useEffect, useRef, useState } from 'react';
import {
  PLAYABLE_HEIGHT, PLAYABLE_WIDTH, PLAYER_START,
  PLAYER_ACCELERATION, PLAYER_EDGE_GAP, PLAYER_FRICTION,
  PLAYER_MAX_SPEED, PLAYER_SIZE,
} from '../game/mapConfig';
import { useMovementSystem } from '../game/systems/useMovementSystem';
import type { Weapon } from '../game/types';

export interface Position { x: number; y: number }

interface Props {
  nickname: string;
  canMove: boolean;
  onMove: (position: Position) => void;
  onFootstep?: (position: Position) => void;
  isAttacking?: boolean;
  weapon: Weapon;
}

const start: Position = PLAYER_START;
export function PlayerController({ nickname, canMove, onMove, onFootstep, isAttacking = false, weapon }: Props) {
  const [position, setPosition] = useState<Position>(start);
  const positionRef = useRef<Position>(start);
  const movement = useMovementSystem(canMove);
  const [isWalking, setIsWalking] = useState(false);
  const walkingRef = useRef(false);
  const facingRightRef = useRef(false);
  const [facingRight, setFacingRight] = useState(false);
  const lastFootstep = useRef(0);

  useEffect(() => {
    let velocity = { x: 0, y: 0 };
    let previousTime = performance.now();
    let frame = 0;
    const update = (time: number) => {
      const delta = Math.min((time - previousTime) / 1000, 0.03);
      previousTime = time;
      const { x: inputX, y: inputY } = movement.current;
      if (inputX !== 0 && (inputX > 0) !== facingRightRef.current) {
        facingRightRef.current = inputX > 0;
        setFacingRight(inputX > 0);
      }
      const length = Math.hypot(inputX, inputY) || 1;

      if (canMove && (inputX || inputY)) {
        velocity.x += (inputX / length) * PLAYER_ACCELERATION * delta;
        velocity.y += (inputY / length) * PLAYER_ACCELERATION * delta;
      } else {
        velocity.x *= PLAYER_FRICTION;
        velocity.y *= PLAYER_FRICTION;
      }
      const speed = Math.hypot(velocity.x, velocity.y);
      if (speed > PLAYER_MAX_SPEED) {
        velocity.x = velocity.x / speed * PLAYER_MAX_SPEED;
        velocity.y = velocity.y / speed * PLAYER_MAX_SPEED;
      }
      const walking = speed > 12;
      if (walking !== walkingRef.current) {
        walkingRef.current = walking;
        setIsWalking(walking);
      }
      const min = PLAYER_EDGE_GAP;
      const next = {
        x: Math.max(min, Math.min(PLAYABLE_WIDTH - PLAYER_SIZE - min, positionRef.current.x + velocity.x * delta)),
        y: Math.max(min, Math.min(PLAYABLE_HEIGHT - PLAYER_SIZE - min, positionRef.current.y + velocity.y * delta)),
      };
      if (walking && time - lastFootstep.current > 230) {
        lastFootstep.current = time;
        onFootstep?.(next);
      }
      positionRef.current = next;
      setPosition(next);
      onMove(next);
      frame = requestAnimationFrame(update);
    };

    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [canMove, movement, onFootstep, onMove]);

  return (
    <div className={`player ${facingRight ? 'player--mirrored' : ''} ${isWalking ? 'player--walking' : ''} ${isAttacking ? 'player--attacking' : ''}`} style={{ transform: `translate(${position.x}px, ${position.y}px)` }} aria-label="Игрок">
      <span className="player__nickname">{nickname}</span>
      <span className="player__sprite"><span className="player__hair" /><span className="player__head"><i /></span>
      <span className="player__arm player__arm--left" /><span className="player__body" />
      <span className="player__arm player__arm--right" /><span className="player__legs" />
      <span className={`player__weapon player__weapon--${weapon}`}><i /></span></span>
      <span className="player__collider" />
    </div>
  );
}
