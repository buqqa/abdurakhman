import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { InteractableObject } from '../interactions';
import type { WorldHit } from '../multiplayer';
import type { Weapon } from '../types';
import { playGameSound } from '../../lib/gameAudio';

interface Options {
  weapon: Weapon;
  worldHit?: WorldHit;
  setObjects: Dispatch<SetStateAction<InteractableObject[]>>;
  onHarvest: () => void;
  onSwing: () => void;
  onWorldHit: (id: string, hitsToFell: number) => void;
}

export function useTreeHarvest({ weapon, worldHit, setObjects, onHarvest, onSwing, onWorldHit }: Options) {
  const hits = useRef<Record<string, number>>({});
  const [animation, setAnimation] = useState<{ id: string; falling: boolean }>();
  const applyHit = useCallback((treeId: string, hitsToFell: number, reward: boolean) => {
    if ((hits.current[treeId] ?? 0) >= hitsToFell) return;
    if (reward) onHarvest();
    hits.current[treeId] = (hits.current[treeId] ?? 0) + 1;
    const falling = hits.current[treeId] >= hitsToFell;
    setAnimation({ id: treeId, falling });
    window.setTimeout(() => setAnimation(undefined), falling ? 620 : 260);
    if (falling) window.setTimeout(() => setObjects((items) => items.filter((item) => item.id !== treeId)), 600);
  }, [onHarvest, setObjects]);
  const harvestTree = useCallback((tree: { id: string }) => {
    const hitsToFell = weapon === 'spear' ? 4 : 3;
    if ((hits.current[tree.id] ?? 0) >= hitsToFell) return;
    playGameSound('chop');
    onSwing();
    applyHit(tree.id, hitsToFell, true);
    onWorldHit(tree.id, hitsToFell);
  }, [applyHit, onSwing, onWorldHit, weapon]);
  useEffect(() => {
    if (worldHit) applyHit(worldHit.id, worldHit.hitsToFell, false);
  }, [applyHit, worldHit?.nonce]);

  return { treeAnimation: animation, harvestTree };
}
