import type { Position } from '../components/PlayerController';
import type { GameState, Weapon } from './types';
import type { Zombie } from './zombies';
import type { InteractableObject } from './interactions';
import type { StructureKind, WorldStructure } from './structures';

export interface RemotePlayer extends Position { id: string; nickname: string; weapon: Weapon; health: number; downed: boolean; walking: boolean; facingRight: boolean; attackNonce?: string; updatedAt: number }
export interface PlayerPayload { id: string; nickname: string; x: number; y: number; weapon: Weapon; health: number; downed: boolean; walking: boolean; facingRight: boolean }
export interface PresencePayload { id: string; nickname: string; joinedAt: number }
export type SharedGame = Pick<GameState, 'day' | 'phase' | 'baseHealth' | 'maxNights' | 'difficulty' | 'merchantVisits' | 'completionTime'> & { paused: boolean };
export type ResourceKind = 'wood' | 'food' | 'water' | 'spear' | 'wrench';
export interface SharedDrop extends Position { id: string; kind: ResourceKind }
export interface WorldHit { object: InteractableObject; hitsToBreak: number; playerId: string; nonce: string }
export interface CrateLootGrant { targetId: string; kind: import('./interactions').CrateKind; nonce: string }
export interface ZombieDamageState { sequence: number; totals: Record<string, number> }
export interface ZombieDeath { zombie: Zombie; nonce: string }
export interface SharedWorld { objects: InteractableObject[]; structures: WorldStructure[]; spawnedStructures: StructureKind[] }
export interface WorldTake { id: string; nonce: string; targetId: string; kind: 'food' | 'water' | 'wrench' }
export interface ResourceGrant { id: string; nonce: string; targetId: string; kind: ResourceKind }
