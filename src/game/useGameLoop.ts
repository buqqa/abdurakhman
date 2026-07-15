import { useRef, useState } from 'react';
import { FENCE_COST, FOOD_HEAL, MAX_BASE_HEALTH, REPAIR_PER_WOOD, WATER_HEAL } from './config';
import type { Fence, GameState } from './types';
import { playGameSound } from '../lib/gameAudio';
import type { CrateKind } from './interactions';
import { useI18n } from '../i18n/I18nContext';
import { gameMessages } from '../i18n/gameMessages';

const initialState: GameState = {
  day: 1, phase: 'menu', wood: 0, food: 2, water: 0, playerHealth: 100, baseHealth: MAX_BASE_HEALTH,
  message: '', completionTime: null, maxNights: 5, difficulty: '', fences: [],
};

export function useGameLoop() {
  const { language } = useI18n();
  const message = gameMessages[language];
  const [game, setGame] = useState<GameState>(initialState);
  const startedAt = useRef(Date.now());
  const fenceId = useRef(0);
  const startGame = (maxNights: number, difficulty: string) => {
    playGameSound('start');
    startedAt.current = Date.now();
    fenceId.current = 0;
    setGame({ ...initialState, phase: 'day', maxNights, difficulty, message: message.prepare });
  };
  const gatherWood = () => setGame((state) => ({ ...state, wood: state.wood + 2, message: message.wood }));
  const gatherCrateLoot = (kind: CrateKind) => {
    if (kind === 'crate-water') {
      setGame((state) => ({ ...state, wood: state.wood + 2, water: state.water + 1, message: message.waterLoot }));
    } else if (kind === 'crate-food') {
      setGame((state) => ({ ...state, wood: state.wood + 2, food: state.food + 1, message: message.foodLoot }));
    } else {
      setGame((state) => ({ ...state, wood: state.wood + 8, message: message.stockLoot }));
    }
  };
  const eatFood = () => {
    if (game.food > 0 && game.playerHealth < 100) playGameSound('eat');
    setGame((state) => {
    if (state.food === 0) return { ...state, message: message.noFood };
    if (state.playerHealth === 100) return { ...state, message: message.fullFood };
    const playerHealth = Math.min(100, state.playerHealth + FOOD_HEAL);
    return { ...state, food: state.food - 1, playerHealth, message: message.foodHeal((playerHealth - state.playerHealth) / 10) };
    });
  };
  const drinkWater = () => setGame((state) => {
    if (state.water === 0) return { ...state, message: message.noWater };
    if (state.playerHealth === 100) return { ...state, message: message.fullWater };
    const playerHealth = Math.min(100, state.playerHealth + WATER_HEAL);
    playGameSound('eat');
    return { ...state, water: state.water - 1, playerHealth, message: message.waterHeal((playerHealth - state.playerHealth) / 10) };
  });
  const interactionUnavailable = () => setGame((state) => ({ ...state, message: message.closer }));
  const attack = () => setGame((state) => ({ ...state, message: message.miss }));
  const repairBase = () => setGame((state) => {
    if (state.baseHealth === MAX_BASE_HEALTH) return { ...state, message: message.baseFine };
    if (state.wood < 1) return { ...state, message: message.noWoodRepair };
    const baseHealth = Math.min(MAX_BASE_HEALTH, state.baseHealth + REPAIR_PER_WOOD);
    const steps = Math.ceil((MAX_BASE_HEALTH - baseHealth) / REPAIR_PER_WOOD);
    return { ...state, wood: state.wood - 1, baseHealth, message: steps ? message.repairSteps(steps) : message.repaired };
  });
  const buildFence = (position: { x: number; y: number }) => setGame((state) => {
    if (state.wood < FENCE_COST) return { ...state, message: message.noWoodFence(FENCE_COST) };
    if (state.fences.some((fence) => Math.hypot(fence.x - position.x, fence.y - position.y) < 8)) return { ...state, message: message.fenceBusy };
    const fence: Fence = { id: fenceId.current++, x: position.x, y: position.y };
    const fences = [...state.fences, fence];
    return { ...state, wood: state.wood - FENCE_COST, fences, message: fences.length === 11 ? message.fenceDone : message.fenceBuilt(fences.length) };
  });
  const startNight = () => {
    playGameSound('zombie');
    setGame((state) => ({ ...state, phase: 'night', message: message.night(state.day) }));
  };
  const damagePlayer = (damage: number) => setGame((state) => {
    if (state.phase !== 'night') return state;
    const playerHealth = Math.max(0, state.playerHealth - damage);
    return { ...state, playerHealth, phase: playerHealth ? state.phase : 'lost', message: playerHealth ? message.playerHit(damage) : message.playerLost };
  });
  const damageBase = (damage: number) => setGame((state) => {
    if (state.phase !== 'night') return state;
    if (state.fences.length) return { ...state, fences: state.fences.slice(1), message: message.fenceHit };
    const baseHealth = Math.max(0, state.baseHealth - damage);
    return { ...state, baseHealth, phase: baseHealth ? state.phase : 'lost', message: baseHealth ? message.baseHit(damage) : message.baseLost };
  });
  const finishNight = () => setGame((state) => {
    if (state.phase !== 'night') return state;
    if (state.day === state.maxNights) return { ...state, phase: 'won', message: message.won, completionTime: Math.floor((Date.now() - startedAt.current) / 1000) };
    return { ...state, day: state.day + 1, phase: 'day', food: Math.max(0, state.food - 1), message: message.newDay };
  });
  const restart = () => setGame(initialState);

  return { game, startGame, gatherWood, gatherCrateLoot, eatFood, drinkWater, interactionUnavailable, attack, repairBase, buildFence, startNight, damagePlayer, damageBase, finishNight, restart };
}
