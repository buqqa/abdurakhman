import { useCallback, useEffect, useRef, useState } from 'react';
import type { Explosion } from '../../components/ZombieExplosion';
import { playGameSound } from '../../lib/gameAudio';
import type { ZombieDeath } from '../multiplayer';
import type { Zombie } from '../zombies';

export function useZombieDeathEffects(authoritative: boolean | undefined, remoteDeath: ZombieDeath | undefined) {
  const [deaths, setDeaths] = useState<Zombie[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const nextExplosionId = useRef(0);
  const showDeath = useCallback((zombie: Zombie) => {
    setDeaths((current) => [...current.filter((item) => item.id !== zombie.id), zombie]);
    window.setTimeout(() => setDeaths((current) => current.filter((item) => item.id !== zombie.id)), 560);
    if (!zombie.isExplosive) return;
    const explosion = { id: nextExplosionId.current++, x: zombie.x, y: zombie.y };
    setExplosions((current) => [...current, explosion]);
    window.setTimeout(() => setExplosions((current) => current.filter((item) => item.id !== explosion.id)), 520);
    playGameSound('zombieAttack');
  }, []);

  useEffect(() => {
    if (authoritative === false && remoteDeath) showDeath(remoteDeath.zombie);
  }, [authoritative, remoteDeath?.nonce, showDeath]);

  return { deaths, explosions, showDeath };
}
