import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { CrateKind, InteractableObject } from '../interactions';
import type { WorldHit } from '../multiplayer';
import { playGameSound } from '../../lib/gameAudio';

interface Options {
  worldHit?: WorldHit;
  setObjects: Dispatch<SetStateAction<InteractableObject[]>>;
  onLoot: (kind: CrateKind) => void;
  onSwing: () => void;
  onWorldHit: (object: InteractableObject, hitsToBreak: number) => void;
}

const dropsWater = (crate: InteractableObject) => crate.id.startsWith('structure-tent-crate-')
  ? crate.id.endsWith('-0')
  : [...crate.id].reduce((total, char) => total + char.charCodeAt(0), 0) % 100 < 15;

export function useCrateHarvest({ worldHit, setObjects, onLoot, onSwing, onWorldHit }: Options) {
  const hits = useRef<Record<string, number>>({});
  const processed = useRef(new Set<string>());
  const [animation, setAnimation] = useState<{ id: string; breaking: boolean }>();
  const applyHit = useCallback((crate: InteractableObject, reward: boolean) => {
    if ((hits.current[crate.id] ?? 0) >= 3) return;
    hits.current[crate.id] = (hits.current[crate.id] ?? 0) + 1;
    const breaking = hits.current[crate.id] >= 3;
    setAnimation({ id: crate.id, breaking });
    window.setTimeout(() => setAnimation(undefined), breaking ? 520 : 240);
    if (!breaking) return;
    if (reward) onLoot(crate.kind as CrateKind);
    window.setTimeout(() => setObjects((items) => {
      const remaining = items.filter((item) => item.id !== crate.id);
      if (crate.kind !== 'crate-food') return remaining;
      const drops: InteractableObject[] = [{ id: `food-drop-${crate.id}`, kind: 'food', x: crate.x - 8, y: crate.y + 9 }];
      if (dropsWater(crate)) drops.push({ id: `water-drop-${crate.id}`, kind: 'water', x: crate.x + 17, y: crate.y + 9 });
      return [...remaining, ...drops];
    }), 480);
  }, [onLoot, setObjects]);
  const breakCrate = useCallback((crate: InteractableObject) => {
    if ((hits.current[crate.id] ?? 0) >= 3) return;
    onSwing();
    playGameSound('chop');
    applyHit(crate, true);
    onWorldHit(crate, 3);
  }, [applyHit, onSwing, onWorldHit]);
  useEffect(() => {
    if (!worldHit || !worldHit.object.kind.startsWith('crate-') || processed.current.has(worldHit.nonce)) return;
    processed.current.add(worldHit.nonce);
    applyHit(worldHit.object, false);
  }, [applyHit, worldHit?.nonce]);
  return { crateAnimation: animation, breakCrate };
}
