import { useEffect, useRef, useState } from 'react';
import { BASE_POSITION, MAP_HEIGHT, MAP_WIDTH, PLAYER_SIZE } from '../mapConfig';
import type { Phase } from '../types';
import { createZombieWave, type Zombie } from '../zombies';
import type { Position } from '../../components/PlayerController';
import { playGameSound } from '../../lib/gameAudio';
import type { Explosion } from '../../components/ZombieExplosion';

const EXPLOSION_RADIUS = 75;
const EXPLOSION_PLAYER_DAMAGE = 20;
const EXPLOSION_BASE_DAMAGE = 20;

interface Options {
  phase: Phase;
  day: number;
  difficulty: string;
  paused: boolean;
  player: Position;
  onPlayerDamage: (damage: number) => void;
  onBaseDamage: (damage: number) => void;
  onCleared: () => void;
}

export function useZombieWave(options: Options) {
  const [zombies, setZombies] = useState<Zombie[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const explosionId = useRef(0);
  const zombiesRef = useRef<Zombie[]>([]);
  const optionsRef = useRef(options);
  const activeWave = useRef(false);
  const spawnedNight = useRef(0);
  const waitingZombies = useRef<Zombie[]>([]);
  const spawnTimer = useRef<number>();
  optionsRef.current = options;

  useEffect(() => {
    window.clearTimeout(spawnTimer.current);
    if (options.phase !== 'night' || options.paused) return;
    if (spawnedNight.current !== options.day) {
      const wave = createZombieWave(options.day, options.difficulty);
      spawnedNight.current = options.day;
      activeWave.current = true;
      zombiesRef.current = wave.slice(0, 1);
      waitingZombies.current = wave.slice(1);
      setZombies(zombiesRef.current);
    }
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
  }, [options.day, options.difficulty, options.paused, options.phase]);

  useEffect(() => {
    if (options.phase !== 'night' || options.paused) return;
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
            const damage = targetsPlayer ? zombie.playerDamage : zombie.damage;
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
      const survivors = next.filter((zombie) => zombie.health > .001);
      zombiesRef.current = survivors;
      setZombies(survivors);
      attacks.forEach((attack) => attack.player ? optionsRef.current.onPlayerDamage(attack.damage) : optionsRef.current.onBaseDamage(attack.damage));
      if (attacks.length) playGameSound('zombieAttack');
      if (activeWave.current && survivors.length === 0 && waitingZombies.current.length === 0) {
        activeWave.current = false;
        window.setTimeout(() => optionsRef.current.onCleared(), 350);
      }
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [options.paused, options.phase]);

  const hitZombie = (id: string, damage = 1) => {
    const damaged = zombiesRef.current.map((zombie) => zombie.id === id ? { ...zombie, health: zombie.health - damage, hitAt: performance.now() } : zombie);
    const killedExplosive = damaged.find((zombie) => zombie.id === id && zombie.isExplosive && zombie.health <= .001);
    const survivors = damaged.filter((zombie) => zombie.health > .001);
    zombiesRef.current = survivors;
    setZombies(survivors);
    if (killedExplosive) {
      const explosion = { id: explosionId.current++, x: killedExplosive.x, y: killedExplosive.y };
      setExplosions((current) => [...current, explosion]);
      window.setTimeout(() => setExplosions((current) => current.filter((item) => item.id !== explosion.id)), 520);
      playGameSound('zombieAttack');
      const player = { x: optionsRef.current.player.x + PLAYER_SIZE / 2, y: optionsRef.current.player.y + PLAYER_SIZE / 2 };
      if (Math.hypot(player.x - killedExplosive.x, player.y - killedExplosive.y) <= EXPLOSION_RADIUS) optionsRef.current.onPlayerDamage(EXPLOSION_PLAYER_DAMAGE);
      if (Math.hypot(BASE_POSITION.x - killedExplosive.x, BASE_POSITION.y - killedExplosive.y) <= EXPLOSION_RADIUS) optionsRef.current.onBaseDamage(EXPLOSION_BASE_DAMAGE);
    }
    if (activeWave.current && survivors.length === 0 && waitingZombies.current.length === 0) {
      activeWave.current = false;
      window.setTimeout(() => optionsRef.current.onCleared(), 350);
    }
  };

  return { zombies, explosions, hitZombie };
}
