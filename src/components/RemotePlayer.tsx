import { memo, useEffect, useRef, useState } from 'react';
import type { RemotePlayer as RemotePlayerState } from '../game/multiplayer';

export const RemotePlayer = memo(function RemotePlayer({ player }: { player: RemotePlayerState }) {
  const [attacking, setAttacking] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef({ x: player.x, y: player.y });
  const targetRef = useRef({ x: player.x, y: player.y });
  const frameRef = useRef<number>();
  const previousTimeRef = useRef(performance.now());

  useEffect(() => {
    targetRef.current = { x: player.x, y: player.y };
    const distance = Math.hypot(player.x - positionRef.current.x, player.y - positionRef.current.y);
    if (distance > 240) positionRef.current = targetRef.current;
    if (frameRef.current !== undefined) return;
    previousTimeRef.current = performance.now();
    const interpolate = (time: number) => {
      const delta = Math.min(time - previousTimeRef.current, 50);
      previousTimeRef.current = time;
      const current = positionRef.current;
      const target = targetRef.current;
      const remaining = Math.hypot(target.x - current.x, target.y - current.y);
      const amount = 1 - Math.exp(-delta / 55);
      current.x += (target.x - current.x) * amount;
      current.y += (target.y - current.y) * amount;
      if (remaining < 0.15) {
        current.x = target.x;
        current.y = target.y;
      }
      if (elementRef.current) elementRef.current.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      if (remaining < 0.15) frameRef.current = undefined;
      else frameRef.current = requestAnimationFrame(interpolate);
    };
    frameRef.current = requestAnimationFrame(interpolate);
  }, [player.x, player.y]);

  useEffect(() => () => {
    if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
    frameRef.current = undefined;
  }, []);

  useEffect(() => {
    if (!player.attackNonce) return;
    setAttacking(true);
    const timer = window.setTimeout(() => setAttacking(false), 260);
    return () => window.clearTimeout(timer);
  }, [player.attackNonce]);
  return <div ref={elementRef} className={`player player--remote player--${player.weapon} ${player.facingRight ? 'player--mirrored' : ''} ${player.walking ? 'player--walking' : ''} ${attacking ? 'player--attacking' : ''} ${player.downed ? 'player--downed' : ''}`} style={{ transform: `translate3d(${positionRef.current.x}px, ${positionRef.current.y}px, 0)` }}>
    <span className="player__nickname">{player.nickname}</span>
    <span className="player__sprite"><span className="player__hair" /><span className="player__head"><i /></span>
      <span className="player__arm player__arm--left" /><span className="player__body" />
      <span className="player__arm player__arm--right" /><span className="player__legs" />
      <span className={`player__weapon player__weapon--${player.weapon}`}><i /></span>
    </span>
  </div>;
});
