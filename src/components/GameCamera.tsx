import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { MAP_HEIGHT, MAP_WIDTH, PLAYER_SIZE } from '../game/mapConfig';
import type { Position } from './PlayerController';

export function GameCamera({ player, children, overlay }: { player: Position; children: ReactNode; overlay?: ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 700, height: 400 });

  useLayoutEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setViewport({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const centerX = player.x + PLAYER_SIZE / 2;
  const centerY = player.y + PLAYER_SIZE / 2;
  const cameraX = Math.max(0, Math.min(MAP_WIDTH - viewport.width, centerX - viewport.width / 2));
  const cameraY = Math.max(0, Math.min(MAP_HEIGHT - viewport.height, centerY - viewport.height / 2));

  return <div className="map-viewport" ref={viewportRef}><div className="camera-world" style={{ transform: `translate(${-cameraX}px, ${-cameraY}px)` }}>{children}</div>{overlay}</div>;
}
