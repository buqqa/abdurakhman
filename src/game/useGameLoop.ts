import { useCallback, useRef, useState } from 'react';
import { FENCE_COST, FOOD_HEAL, MAX_BASE_HEALTH, REPAIR_PER_STEP, REPAIR_WOOD_COST, SPEAR_COST, WATER_HEAL } from './config';
import type { Fence, GameState } from './types';
import { playGameSound } from '../lib/gameAudio';
import type { CrateKind } from './interactions';
import { useI18n } from '../i18n/I18nContext';
import { gameMessages } from '../i18n/gameMessages';

const initialState: GameState = {
  day: 1, phase: 'menu', wood: 0, food: 2, water: 0, playerHealth: 100, baseHealth: MAX_BASE_HEALTH,
  message: '', completionTime: null, maxNights: 5, difficulty: '', fences: [], weapon: 'axe', hasSpear: false, merchantDay: 5,
};

export function useGameLoop() {
  const { language } = useI18n();
  const message = gameMessages[language];
  const [game, setGame] = useState<GameState>(initialState);
  const startedAt = useRef(Date.now());
  const pausedAt = useRef<number>();
  const pausedTime = useRef(0);
  const fenceId = useRef(0);
  const startGame = (maxNights: number, difficulty: string) => {
    playGameSound('start');
    startedAt.current = Date.now();
    pausedAt.current = undefined;
    pausedTime.current = 0;
    fenceId.current = 0;
    const merchantDay = 5 + Math.floor(Math.random() * 6);
    setGame({ ...initialState, phase: 'day', maxNights, difficulty, merchantDay, message: message.prepare });
  };
  const gatherWood = () => setGame((state) => ({ ...state, wood: state.wood + 2, message: message.wood }));
  const gatherCrateLoot = (kind: CrateKind) => {
    if (kind === 'crate-wood') {
      setGame((state) => ({ ...state, wood: state.wood + 8, message: message.stockLoot }));
    } else {
      const emptyText = language === 'en' ? 'The crate was empty. You received 2 wood from it.' : language === 'kk' ? 'Жәшік бос болды. Одан 2 ағаш алынды.' : 'Ящик оказался пустым. Получено 2 дерева от ящика.';
      setGame((state) => ({ ...state, wood: state.wood + 2, message: kind === 'crate-food' ? message.foodLoot : emptyText }));
    }
  };
  const gatherFood = () => setGame((state) => ({ ...state, food: state.food + 1, message: language === 'en' ? 'Chicken added to the inventory.' : language === 'kk' ? 'Тауық еті қоржынға салынды.' : 'Курица добавлена в инвентарь.' }));
  const gatherWater = () => setGame((state) => ({ ...state, water: state.water + 1, message: language === 'en' ? 'Water added to the inventory.' : language === 'kk' ? 'Су қоржынға салынды.' : 'Вода добавлена в инвентарь.' }));
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
  const buySpear = () => setGame((state) => {
    if (state.hasSpear) return state;
    if (state.wood < SPEAR_COST) return { ...state, message: language === 'en' ? 'You need 50 wood for the spear.' : language === 'kk' ? 'Найзаға 50 ағаш керек.' : 'Для копья нужно 50 дерева.' };
    return { ...state, wood: state.wood - SPEAR_COST, weapon: 'spear', hasSpear: true, message: language === 'en' ? 'Spear equipped. Press Q to switch weapons.' : language === 'kk' ? 'Найза жабдықталды. Қаруды ауыстыру үшін Q бас.' : 'Копьё экипировано. Нажми Q, чтобы сменить оружие.' };
  });
  const switchWeapon = () => setGame((state) => {
    if (!state.hasSpear || (state.phase !== 'day' && state.phase !== 'night')) return state;
    const weapon = state.weapon === 'spear' ? 'axe' : 'spear';
    const weaponName = language === 'en' ? (weapon === 'spear' ? 'Spear' : 'Axe') : language === 'kk' ? (weapon === 'spear' ? 'Найза' : 'Балта') : weapon === 'spear' ? 'Копьё' : 'Топор';
    return { ...state, weapon, message: language === 'en' ? `${weaponName} equipped.` : language === 'kk' ? `${weaponName} жабдықталды.` : `${weaponName} экипирован.` };
  });
  const repairBase = () => setGame((state) => {
    if (state.baseHealth === MAX_BASE_HEALTH) return { ...state, message: message.baseFine };
    if (state.wood < REPAIR_WOOD_COST) return { ...state, message: language === 'en' ? 'You need 5 wood for one repair step.' : language === 'kk' ? 'Бір жөндеу қадамына 5 ағаш керек.' : 'Для одного шага ремонта нужно 5 дерева.' };
    const baseHealth = Math.min(MAX_BASE_HEALTH, state.baseHealth + REPAIR_PER_STEP);
    const steps = Math.ceil((MAX_BASE_HEALTH - baseHealth) / REPAIR_PER_STEP);
    return { ...state, wood: state.wood - REPAIR_WOOD_COST, baseHealth, message: steps ? message.repairSteps(steps) : message.repaired };
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
    if (state.day === state.maxNights) return { ...state, phase: 'won', message: message.won, completionTime: Math.floor((Date.now() - startedAt.current - pausedTime.current) / 1000) };
    return { ...state, day: state.day + 1, phase: 'day', food: Math.max(0, state.food - 1), message: message.newDay };
  });
  const restart = () => setGame(initialState);
  const pauseClock = useCallback(() => { pausedAt.current ??= Date.now(); }, []);
  const resumeClock = useCallback(() => {
    if (!pausedAt.current) return;
    pausedTime.current += Date.now() - pausedAt.current;
    pausedAt.current = undefined;
  }, []);

  return { game, startGame, gatherWood, gatherCrateLoot, gatherFood, gatherWater, eatFood, drinkWater, interactionUnavailable, attack, buySpear, switchWeapon, repairBase, buildFence, startNight, damagePlayer, damageBase, finishNight, restart, pauseClock, resumeClock };
}
