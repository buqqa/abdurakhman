import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { MAP_HEIGHT, MAP_WIDTH, PLAYER_SIZE } from '../game/mapConfig';
import type { Position } from './PlayerController';

export function GameCamera({ player, children, overlay, lookAheadY = 0 }: { player: Position; children: ReactNode; overlay?: ReactNode; lookAheadY?: number }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 700, height: 400 });

  useLayoutEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setViewport({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scale = Math.max(1, viewport.width / MAP_WIDTH, viewport.height / MAP_HEIGHT);
  const visibleWidth = viewport.width / scale;
  const visibleHeight = viewport.height / scale;
  const centerX = player.x + PLAYER_SIZE / 2;
  const centerY = player.y + PLAYER_SIZE / 2;
  const cameraX = Math.round(Math.max(0, Math.min(MAP_WIDTH - visibleWidth, centerX - visibleWidth / 2)));
  const maxCameraY = Math.max(0, MAP_HEIGHT - visibleHeight);
  const cameraY = Math.round(Math.max(0, Math.min(maxCameraY, centerY - visibleHeight / 2 + lookAheadY)));

  return <div className="map-viewport" ref={viewportRef}><div className="camera-world" style={{ transform: `scale(${scale}) translate(${-cameraX}px, ${-cameraY}px)` }}>{children}</div>{overlay}</div>;
}
