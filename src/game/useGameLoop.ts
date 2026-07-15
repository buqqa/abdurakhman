import { useRef, useState } from 'react';
import { FENCE_COST, FOOD_HEAL, MAX_BASE_HEALTH, REPAIR_PER_WOOD, WATER_HEAL } from './config';
import type { Fence, GameState } from './types';
import { playGameSound } from '../lib/gameAudio';
import type { CrateKind } from './interactions';

const initialState: GameState = {
  day: 1, phase: 'menu', wood: 0, food: 2, water: 0, playerHealth: 100, baseHealth: MAX_BASE_HEALTH,
  message: '', completionTime: null, maxNights: 5, difficulty: '', fences: [],
};

export function useGameLoop() {
  const [game, setGame] = useState<GameState>(initialState);
  const startedAt = useRef(Date.now());
  const fenceId = useRef(0);
  const startGame = (maxNights: number, difficulty: string) => {
    playGameSound('start');
    startedAt.current = Date.now();
    fenceId.current = 0;
    setGame({ ...initialState, phase: 'day', maxNights, difficulty, message: 'Исследуй лес и подготовь базу до темноты.' });
  };
  const gatherWood = () => setGame((state) => ({ ...state, wood: state.wood + 2, message: 'Топором добыто 2 дерева.' }));
  const gatherCrateLoot = (kind: CrateKind) => {
    if (kind === 'crate-water') {
      setGame((state) => ({ ...state, wood: state.wood + 2, water: state.water + 1, message: 'В ящике найдена вода и получено 2 дерева. Вода лечит 3 сердца.' }));
    } else if (kind === 'crate-food') {
      setGame((state) => ({ ...state, wood: state.wood + 2, food: state.food + 1, message: 'В ящике найдена курица и получено 2 дерева.' }));
    } else {
      setGame((state) => ({ ...state, wood: state.wood + 8, message: 'На складе найден запас: 6 дров и 2 дерева от ящика.' }));
    }
  };
  const eatFood = () => {
    if (game.food > 0 && game.playerHealth < 100) playGameSound('eat');
    setGame((state) => {
    if (state.food === 0) return { ...state, message: 'В инвентаре нет еды.' };
    if (state.playerHealth === 100) return { ...state, message: 'Здоровье уже полное — еда не потрачена.' };
    const playerHealth = Math.min(100, state.playerHealth + FOOD_HEAL);
    return { ...state, food: state.food - 1, playerHealth, message: `Курица восстановила ${(playerHealth - state.playerHealth) / 10} сердца.` };
    });
  };
  const drinkWater = () => setGame((state) => {
    if (state.water === 0) return { ...state, message: 'В инвентаре нет воды.' };
    if (state.playerHealth === 100) return { ...state, message: 'Здоровье уже полное — вода не потрачена.' };
    const playerHealth = Math.min(100, state.playerHealth + WATER_HEAL);
    playGameSound('eat');
    return { ...state, water: state.water - 1, playerHealth, message: `Вода восстановила ${(playerHealth - state.playerHealth) / 10} сердца.` };
  });
  const interactionUnavailable = () => setGame((state) => ({ ...state, message: 'Подойди ближе к объекту.' }));
  const attack = () => setGame((state) => ({ ...state, message: 'Топор не достаёт до цели.' }));
  const repairBase = () => setGame((state) => {
    if (state.baseHealth === MAX_BASE_HEALTH) return { ...state, message: 'База не повреждена.' };
    if (state.wood < 1) return { ...state, message: 'Для шага ремонта нужно 1 дерево.' };
    const baseHealth = Math.min(MAX_BASE_HEALTH, state.baseHealth + REPAIR_PER_WOOD);
    const steps = Math.ceil((MAX_BASE_HEALTH - baseHealth) / REPAIR_PER_WOOD);
    return { ...state, wood: state.wood - 1, baseHealth, message: steps ? `Часть базы починена. Осталось шагов: ${steps}.` : 'База полностью отремонтирована.' };
  });
  const buildFence = (position: { x: number; y: number }) => setGame((state) => {
    if (state.wood < FENCE_COST) return { ...state, message: `Для забора нужно ${FENCE_COST} дерева.` };
    if (state.fences.some((fence) => Math.hypot(fence.x - position.x, fence.y - position.y) < 8)) return { ...state, message: 'Это место уже занято забором.' };
    const fence: Fence = { id: fenceId.current++, x: position.x, y: position.y };
    const fences = [...state.fences, fence];
    return { ...state, wood: state.wood - FENCE_COST, fences, message: fences.length === 11 ? 'Защитный круг завершён, проход оставлен открытым!' : `Забор построен: ${fences.length}/11.` };
  });
  const startNight = () => {
    playGameSound('zombie');
    setGame((state) => ({ ...state, phase: 'night', message: `Ночь ${state.day}. Уничтожь всех зомби!` }));
  };
  const damagePlayer = (damage: number) => setGame((state) => {
    if (state.phase !== 'night') return state;
    const playerHealth = Math.max(0, state.playerHealth - damage);
    return { ...state, playerHealth, phase: playerHealth ? state.phase : 'lost', message: playerHealth ? `Зомби ранил тебя: -${damage} HP.` : 'Игрок погиб.' };
  });
  const damageBase = (damage: number) => setGame((state) => {
    if (state.phase !== 'night') return state;
    if (state.fences.length) return { ...state, fences: state.fences.slice(1), message: 'Зомби сломал забор, база не пострадала.' };
    const baseHealth = Math.max(0, state.baseHealth - damage);
    return { ...state, baseHealth, phase: baseHealth ? state.phase : 'lost', message: baseHealth ? `Зомби повредил базу: -${damage}.` : 'Зомби разрушили базу.' };
  });
  const finishNight = () => setGame((state) => {
    if (state.phase !== 'night') return state;
    if (state.day === state.maxNights) return { ...state, phase: 'won', message: 'Спасатели прибыли!', completionTime: Math.floor((Date.now() - startedAt.current) / 1000) };
    return { ...state, day: state.day + 1, phase: 'day', food: Math.max(0, state.food - 1), message: 'Волна уничтожена. Наступил новый день.' };
  });
  const restart = () => setGame(initialState);

  return { game, startGame, gatherWood, gatherCrateLoot, eatFood, drinkWater, interactionUnavailable, attack, repairBase, buildFence, startNight, damagePlayer, damageBase, finishNight, restart };
}
