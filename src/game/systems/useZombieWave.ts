import { useEffect, useRef, useState } from 'react';
import { BASE_POSITION, MAP_HEIGHT, MAP_WIDTH, PLAYER_SIZE } from '../mapConfig';
import type { Phase } from '../types';
import { createZombieWave, type Zombie } from '../zombies';
import type { Position } from '../../components/PlayerController';
import { playGameSound } from '../../lib/gameAudio';

interface Options {
  phase: Phase;
  day: number;
  player: Position;
  onPlayerDamage: (damage: number) => void;
  onBaseDamage: (damage: number) => void;
  onCleared: () => void;
}

export function useZombieWave(options: Options) {
  const [zombies, setZombies] = useState<Zombie[]>([]);
  const zombiesRef = useRef<Zombie[]>([]);
  const optionsRef = useRef(options);
  const activeWave = useRef(false);
  const spawnedNight = useRef(0);
  const waitingZombies = useRef<Zombie[]>([]);
  const spawnTimer = useRef<number>();
  optionsRef.current = options;

  useEffect(() => {
    window.clearTimeout(spawnTimer.current);
    if (options.phase !== 'night' || spawnedNight.current === options.day) return;
    const wave = createZombieWave(options.day);
    spawnedNight.current = options.day;
    activeWave.current = true;
    zombiesRef.current = wave.slice(0, 1);
    waitingZombies.current = wave.slice(1);
    setZombies(zombiesRef.current);
    const spawnNext = () => {
      if (!waitingZombies.current.length) return;
      spawnTimer.current = window.setTimeout(() => {
        const groupRoll = Math.random();
        const groupSize = groupRoll < .05 ? 3 : groupRoll < .2 ? 2 : 1;
        const group = waitingZombies.current.splice(0, groupSize);
        if (!group.length) return;
        playGameSound('zombie');
        zombiesRef.current = [...zombiesRef.current, ...group];
        setZombies(zombiesRef.current);
        spawnNext();
      }, 650 + Math.random() * 1700);
    };
    spawnNext();
    return () => window.clearTimeout(spawnTimer.current);
  }, [options.day, options.phase]);

  useEffect(() => {
    if (options.phase !== 'night') return;
    let frame = 0;
    let previous = performance.now();
    const update = (time: number) => {
      const delta = Math.min((time - previous) / 1000, 0.04);
      previous = time;
      const player = { x: optionsRef.current.player.x + PLAYER_SIZE / 2, y: optionsRef.current.player.y + PLAYER_SIZE / 2 };
      const base = BASE_POSITION;
      const attacks: Array<{ player: boolean; damage: number }> = [];
      const next = zombiesRef.current.map((zombie) => {
        const playerDistance = Math.hypot(player.x - zombie.x, player.y - zombie.y);
        const baseDistance = Math.hypot(base.x - zombie.x, base.y - zombie.y);
        const targetsPlayer = playerDistance < baseDistance;
        const target = targetsPlayer ? player : base;
        const distance = targetsPlayer ? playerDistance : baseDistance;
        const attackDistance = targetsPlayer ? 20 : 68;
        if (distance <= attackDistance) {
          if (time - zombie.lastAttack >= 1050) {
            const damage = targetsPlayer ? (zombie.isBoss ? 20 : 10) : zombie.damage;
            attacks.push({ player: targetsPlayer, damage });
            return { ...zombie, lastAttack: time };
          }
          return zombie;
        }
        const step = Math.min(distance, zombie.speed * delta);
        const x = zombie.x + (target.x - zombie.x) / distance * step;
        const y = zombie.y + (target.y - zombie.y) / distance * step;
        return { ...zombie, facingLeft: target.x < zombie.x, x: Math.max(25, Math.min(MAP_WIDTH - 35, x)), y: Math.max(25, Math.min(MAP_HEIGHT - 40, y)) };
      });
      zombiesRef.current = next;
      setZombies(next);
      attacks.forEach((attack) => attack.player ? optionsRef.current.onPlayerDamage(attack.damage) : optionsRef.current.onBaseDamage(attack.damage));
      if (attacks.length) playGameSound('zombieAttack');
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [options.phase]);

  const hitZombie = (id: string) => {
    const damaged = zombiesRef.current.map((zombie) => zombie.id === id ? { ...zombie, health: zombie.health - 1, hitAt: performance.now() } : zombie);
    const survivors = damaged.filter((zombie) => zombie.health > 0);
    zombiesRef.current = survivors;
    setZombies(survivors);
    if (activeWave.current && survivors.length === 0 && waitingZombies.current.length === 0) {
      activeWave.current = false;
      window.setTimeout(() => optionsRef.current.onCleared(), 350);
    }
  };

  return { zombies, hitZombie };
}
