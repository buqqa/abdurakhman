import type { Position } from '../../components/PlayerController';
import { BASE_POSITION, MAP_HEIGHT, MAP_WIDTH, PLAYER_SIZE } from '../mapConfig';
import type { RemotePlayer } from '../multiplayer';
import type { Zombie } from '../zombies';

export interface ZombieAttack { kind: 'local' | 'remote' | 'base'; id?: string; damage: number }

interface Options {
  zombies: Zombie[];
  player: Position;
  playerHealth: number;
  teammates: RemotePlayer[];
  time: number;
  delta: number;
}

export function moveZombies({ zombies, player, playerHealth, teammates, time, delta }: Options) {
  const local = { x: player.x + PLAYER_SIZE / 2, y: player.y + PLAYER_SIZE / 2 };
  const players = [
    ...(playerHealth > 0 ? [{ kind: 'local' as const, id: 'local', ...local }] : []),
    ...teammates.filter((teammate) => !teammate.downed && teammate.health > 0)
      .map((teammate) => ({ kind: 'remote' as const, id: teammate.id, x: teammate.x + PLAYER_SIZE / 2, y: teammate.y + PLAYER_SIZE / 2 })),
  ];
  const attacks: ZombieAttack[] = [];
  const next = zombies.map((zombie) => {
    const baseDistance = Math.hypot(BASE_POSITION.x - zombie.x, BASE_POSITION.y - zombie.y);
    const nearest = players.reduce<{ kind: 'local' | 'remote'; id: string; x: number; y: number; distance: number } | undefined>((best, candidate) => {
      const distance = Math.hypot(candidate.x - zombie.x, candidate.y - zombie.y);
      return !best || distance < best.distance ? { ...candidate, distance } : best;
    }, undefined);
    const target = nearest && nearest.distance < baseDistance
      ? nearest
      : { kind: 'base' as const, x: BASE_POSITION.x, y: BASE_POSITION.y, distance: baseDistance };
    const targetsPlayer = target.kind !== 'base';
    if (target.distance <= (targetsPlayer ? 20 : 68)) {
      if (time - zombie.lastAttack >= 1050) {
        attacks.push({ kind: target.kind, id: 'id' in target ? target.id : undefined, damage: targetsPlayer ? zombie.playerDamage : zombie.damage });
        return { ...zombie, lastAttack: time };
      }
      return zombie;
    }
    const step = Math.min(target.distance, zombie.speed * delta);
    const x = zombie.x + (target.x - zombie.x) / target.distance * step;
    const y = zombie.y + (target.y - zombie.y) / target.distance * step;
    return { ...zombie, facingLeft: target.x < zombie.x, x: Math.max(25, Math.min(MAP_WIDTH - 35, x)), y: Math.max(25, Math.min(MAP_HEIGHT - 40, y)) };
  });
  return { next, attacks };
}
