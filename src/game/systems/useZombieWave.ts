import { useEffect, useRef, useState } from 'react';
import { BASE_POSITION, PLAYER_SIZE } from '../mapConfig';
import type { Phase } from '../types';
import { createZombieWave, type Zombie } from '../zombies';
import type { Position } from '../../components/PlayerController';
import { playGameSound } from '../../lib/gameAudio';
import type { RemotePlayer, ZombieDeath } from '../multiplayer';
import { useZombieDeathEffects } from './useZombieDeathEffects';
import { moveZombies } from './zombieMovement';

const EXPLOSION_RADIUS = 75;
const EXPLOSION_PLAYER_DAMAGE = 20;
const EXPLOSION_BASE_DAMAGE = 20;

interface Options {
  phase: Phase;
  day: number;
  difficulty: string;
  paused: boolean;
  player: Position;
  playerHealth: number;
  teammates: RemotePlayer[];
  onPlayerDamage: (damage: number) => void;
  onRemotePlayerDamage: (id: string, damage: number) => void;
  onBaseDamage: (damage: number) => void;
  onCleared: () => void;
  authoritative?: boolean;
  externalZombies?: Zombie[];
  onZombiesChange?: (zombies: Zombie[]) => void;
  onRemoteHit?: (id: string, damage: number) => void;
  remoteHit?: { id: string; damage: number; nonce: string };
  remoteDeath?: ZombieDeath;
  onZombieDeath?: (zombie: Zombie) => void;
}

export function useZombieWave(options: Options) {
  const [zombies, setZombies] = useState<Zombie[]>([]);
  const { deaths, explosions, showDeath } = useZombieDeathEffects(options.authoritative, options.remoteDeath);
  const zombiesRef = useRef<Zombie[]>([]);
  const optionsRef = useRef(options);
  const activeWave = useRef(false);
  const spawnedNight = useRef(0);
  const waitingZombies = useRef<Zombie[]>([]);
  const spawnTimer = useRef<number>();
  optionsRef.current = options;
  useEffect(() => {
    if (options.authoritative !== false) return;
    const shared = options.externalZombies ?? [];
    zombiesRef.current = shared;
    setZombies(shared);
    if (options.phase === 'night') {
      spawnedNight.current = options.day;
      activeWave.current = true;
      waitingZombies.current = [];
    }
  }, [options.authoritative, options.day, options.externalZombies, options.phase]);

  useEffect(() => {
    window.clearTimeout(spawnTimer.current);
    if (options.authoritative === false || options.phase !== 'night' || options.paused) return;
    if (spawnedNight.current !== options.day) {
      const wave = createZombieWave(options.day, options.difficulty);
      spawnedNight.current = options.day;
      activeWave.current = true;
      zombiesRef.current = wave.slice(0, 1).map((zombie) => ({ ...zombie, spawnedAt: Date.now() }));
      waitingZombies.current = wave.slice(1);
      setZombies(zombiesRef.current);
      optionsRef.current.onZombiesChange?.(zombiesRef.current);
    }
    const spawnNext = () => {
      if (!waitingZombies.current.length) return;
      spawnTimer.current = window.setTimeout(() => {
        const groupRoll = Math.random();
        const groupSize = groupRoll < .05 ? 3 : groupRoll < .2 ? 2 : 1;
        const group = waitingZombies.current.splice(0, groupSize)
          .map((zombie) => ({ ...zombie, spawnedAt: Date.now() }));
        if (!group.length) return;
        playGameSound('zombieSpawn');
        zombiesRef.current = [...zombiesRef.current, ...group];
        setZombies(zombiesRef.current);
        optionsRef.current.onZombiesChange?.(zombiesRef.current);
        spawnNext();
      }, 650 + Math.random() * 1700);
    };
    spawnNext();
    return () => window.clearTimeout(spawnTimer.current);
  }, [options.authoritative, options.day, options.difficulty, options.paused, options.phase]);

  useEffect(() => {
    if (options.authoritative === false || options.phase !== 'night' || options.paused) return;
    let frame = 0;
    let previous = performance.now();
    const update = (time: number) => {
      const delta = Math.min((time - previous) / 1000, 0.04);
      previous = time;
      const { next, attacks } = moveZombies({ zombies: zombiesRef.current, player: optionsRef.current.player, playerHealth: optionsRef.current.playerHealth, teammates: optionsRef.current.teammates, time, delta });
      const survivors = next.filter((zombie) => zombie.health > .001);
      zombiesRef.current = survivors;
      setZombies(survivors);
      optionsRef.current.onZombiesChange?.(survivors);
      attacks.forEach((attack) => {
        if (attack.kind === 'local') optionsRef.current.onPlayerDamage(attack.damage);
        else if (attack.kind === 'remote' && attack.id) optionsRef.current.onRemotePlayerDamage(attack.id, attack.damage);
        else optionsRef.current.onBaseDamage(attack.damage);
      });
      if (attacks.length) playGameSound('zombieAttack');
      if (activeWave.current && survivors.length === 0 && waitingZombies.current.length === 0) {
        activeWave.current = false;
        window.setTimeout(() => optionsRef.current.onCleared(), 350);
      }
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [options.authoritative, options.paused, options.phase]);

  const hitZombie = (id: string, damage = 1) => {
    if (optionsRef.current.paused || optionsRef.current.phase !== 'night') return;
    if (optionsRef.current.authoritative === false) return optionsRef.current.onRemoteHit?.(id, damage);
    const damaged = zombiesRef.current.map((zombie) => zombie.id === id ? { ...zombie, health: zombie.health - damage, hitAt: Date.now() } : zombie);
    const killedZombie = damaged.find((zombie) => zombie.id === id && zombie.health <= .001);
    const survivors = damaged.filter((zombie) => zombie.health > .001);
    zombiesRef.current = survivors;
    setZombies(survivors);
    optionsRef.current.onZombiesChange?.(survivors);
    if (killedZombie) {
      showDeath(killedZombie);
      optionsRef.current.onZombieDeath?.(killedZombie);
    }
    if (killedZombie?.isExplosive) {
      const player = { x: optionsRef.current.player.x + PLAYER_SIZE / 2, y: optionsRef.current.player.y + PLAYER_SIZE / 2 };
      if (Math.hypot(player.x - killedZombie.x, player.y - killedZombie.y) <= EXPLOSION_RADIUS) optionsRef.current.onPlayerDamage(EXPLOSION_PLAYER_DAMAGE);
      optionsRef.current.teammates.filter((teammate) => !teammate.downed && Math.hypot(teammate.x + PLAYER_SIZE / 2 - killedZombie.x, teammate.y + PLAYER_SIZE / 2 - killedZombie.y) <= EXPLOSION_RADIUS)
        .forEach((teammate) => optionsRef.current.onRemotePlayerDamage(teammate.id, EXPLOSION_PLAYER_DAMAGE));
      if (Math.hypot(BASE_POSITION.x - killedZombie.x, BASE_POSITION.y - killedZombie.y) <= EXPLOSION_RADIUS) optionsRef.current.onBaseDamage(EXPLOSION_BASE_DAMAGE);
    }
    if (activeWave.current && survivors.length === 0 && waitingZombies.current.length === 0) {
      activeWave.current = false;
      window.setTimeout(() => optionsRef.current.onCleared(), 350);
    }
  };
  useEffect(() => {
    if (options.authoritative !== false && options.remoteHit) hitZombie(options.remoteHit.id, options.remoteHit.damage);
  }, [options.remoteHit?.nonce]);
  return { zombies, deaths, explosions, hitZombie };
}
