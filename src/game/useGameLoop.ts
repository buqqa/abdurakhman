import { useCallback, useRef, useState } from 'react';
import { AXE_COST, FOOD_HEAL, MAX_BASE_HEALTH, REPAIR_PER_STEP, repairWoodCost, SPEAR_COST, WATER_HEAL } from './config';
import type { GameState, Weapon } from './types';
import { playGameSound } from '../lib/gameAudio';
import type { CrateKind } from './interactions';
import { useI18n } from '../i18n/I18nContext';
import { gameMessages } from '../i18n/gameMessages';
import type { SharedGame } from './multiplayer';
import type { ResourceKind } from './multiplayer';
import { createMerchantVisits } from './merchantSchedule';

const initialState: GameState = {
  day: 1, phase: 'menu', wood: 0, food: 2, water: 0, playerHealth: 100, baseHealth: MAX_BASE_HEALTH,
  message: '', completionTime: null, maxNights: 5, difficulty: '', weapon: 'hammer', hasSpear: false, hasAxe: false, hasWrench: false, hasSeenWrench: false, merchantVisits: [],
};

export function useGameLoop() {
  const { language } = useI18n();
  const message = gameMessages[language];
  const [game, setGame] = useState<GameState>(initialState);
  const startedAt = useRef(Date.now());
  const pausedAt = useRef<number>();
  const pausedTime = useRef(0);
  const startGame = (maxNights: number, difficulty: string) => {
    playGameSound('start');
    startedAt.current = Date.now();
    pausedAt.current = undefined;
    pausedTime.current = 0;
    const merchantVisits = createMerchantVisits(difficulty);
    setGame({ ...initialState, phase: 'day', maxNights, difficulty, merchantVisits, message: message.prepare });
  };
  const gatherWood = () => setGame((state) => ({ ...state, wood: state.wood + 2, message: language === 'en'
    ? `The ${state.weapon} yielded 2 wood.`
    : language === 'kk' ? `${state.weapon === 'spear' ? 'Найзамен' : state.weapon === 'axe' ? 'Балтамен' : state.weapon === 'wrench' ? 'Сомын кілтімен' : 'Балғамен'} 2 ағаш алынды.`
      : `${state.weapon === 'spear' ? 'Копьём' : state.weapon === 'axe' ? 'Топором' : state.weapon === 'wrench' ? 'Гаечным ключом' : 'Молотом'} добыто 2 дерева.` }));
  const gatherCrateLoot = (kind: CrateKind) => {
    if (kind === 'crate-wrench') {
      setGame((state) => ({ ...state, hasWrench: true, hasSeenWrench: true, weapon: 'wrench', message: language === 'en' ? 'Wrench equipped.' : language === 'kk' ? 'Сомын кілті жабдықталды.' : 'Гаечный ключ экипирован.' }));
    } else if (kind === 'crate-wood') {
      setGame((state) => ({ ...state, wood: state.wood + 10, message: language === 'en' ? 'The warehouse crate contained 10 wood.' : language === 'kk' ? 'Қойма жәшігінен 10 ағаш табылды.' : 'В ящике склада найдено 10 дерева.' }));
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
  const attack = () => setGame((state) => ({ ...state, message: language === 'en'
    ? `The ${state.weapon} cannot reach the target.`
    : language === 'kk' ? `${state.weapon === 'spear' ? 'Найза' : state.weapon === 'axe' ? 'Балта' : state.weapon === 'wrench' ? 'Сомын кілті' : 'Балға'} нысанаға жетпейді.`
      : `${state.weapon === 'spear' ? 'Копьё' : state.weapon === 'axe' ? 'Топор' : state.weapon === 'wrench' ? 'Гаечный ключ' : 'Молот'} не достаёт до цели.` }));
  const buySpear = () => setGame((state) => {
    if (state.hasSpear) return state;
    if (state.wood < SPEAR_COST) return { ...state, message: language === 'en' ? 'You need 50 wood for the spear.' : language === 'kk' ? 'Найзаға 50 ағаш керек.' : 'Для копья нужно 50 дерева.' };
    return { ...state, wood: state.wood - SPEAR_COST, weapon: 'spear', hasSpear: true, message: language === 'en' ? 'Spear equipped. Press Q to switch weapons.' : language === 'kk' ? 'Найза жабдықталды. Қаруды ауыстыру үшін Q бас.' : 'Копьё экипировано. Нажми Q, чтобы сменить оружие.' };
  });
  const buyAxe = () => setGame((state) => {
    if (state.hasAxe) return state;
    if (state.wood < AXE_COST) return { ...state, message: language === 'en' ? 'You need 50 wood for the axe.' : language === 'kk' ? 'Балтаға 50 ағаш керек.' : 'Для топора нужно 50 дерева.' };
    return { ...state, wood: state.wood - AXE_COST, weapon: 'axe', hasAxe: true, message: language === 'en' ? 'Axe equipped. It fells trees in 2 hits.' : language === 'kk' ? 'Балта жабдықталды. Ол ағашты 2 соққымен шабады.' : 'Топор экипирован. Он добывает дерево за 2 удара.' };
  });
  const switchWeapon = () => setGame((state) => {
    if ((!state.hasSpear && !state.hasAxe && !state.hasWrench) || (state.phase !== 'day' && state.phase !== 'night')) return state;
    const weapons: Weapon[] = ['hammer', ...(state.hasSpear ? ['spear' as const] : []), ...(state.hasAxe ? ['axe' as const] : []), ...(state.hasWrench ? ['wrench' as const] : [])];
    const weapon = weapons[(weapons.indexOf(state.weapon) + 1) % weapons.length];
    const weaponName = language === 'en' ? (weapon === 'spear' ? 'Spear' : weapon === 'axe' ? 'Axe' : weapon === 'wrench' ? 'Wrench' : 'Hammer')
      : language === 'kk' ? (weapon === 'spear' ? 'Найза' : weapon === 'axe' ? 'Балта' : weapon === 'wrench' ? 'Сомын кілті' : 'Балға')
        : weapon === 'spear' ? 'Копьё' : weapon === 'axe' ? 'Топор' : weapon === 'wrench' ? 'Гаечный ключ' : 'Молот';
    return { ...state, weapon, message: language === 'en' ? `${weaponName} equipped.` : language === 'kk' ? `${weaponName} жабдықталды.` : `${weaponName} экипирован.` };
  });
  const repairBase = () => setGame((state) => {
    const woodCost = repairWoodCost(state.weapon);
    if (state.baseHealth === MAX_BASE_HEALTH) return { ...state, message: message.baseFine };
    if (state.wood < woodCost) return { ...state, message: language === 'en' ? `You need ${woodCost} wood for one repair step.` : language === 'kk' ? `Бір жөндеу қадамына ${woodCost} ағаш керек.` : `Для одного шага ремонта нужно ${woodCost} дерева.` };
    const baseHealth = Math.min(MAX_BASE_HEALTH, state.baseHealth + REPAIR_PER_STEP);
    const steps = Math.ceil((MAX_BASE_HEALTH - baseHealth) / REPAIR_PER_STEP);
    return { ...state, wood: state.wood - woodCost, baseHealth, message: steps ? message.repairSteps(steps) : message.repaired };
  });
  const applyTeammateRepair = () => setGame((state) => ({
    ...state,
    baseHealth: Math.min(MAX_BASE_HEALTH, state.baseHealth + REPAIR_PER_STEP),
  }));
  const startNight = () => {
    playGameSound('zombieSpawn');
    setGame((state) => ({ ...state, phase: 'night', message: message.night(state.day) }));
  };
  const damagePlayer = (damage: number, canBeRevived = false) => setGame((state) => {
    if (state.phase !== 'night') return state;
    const playerHealth = Math.max(0, state.playerHealth - damage);
    return { ...state, playerHealth, phase: playerHealth || canBeRevived ? state.phase : 'lost', message: playerHealth ? message.playerHit(damage) : canBeRevived ? 'Вы ранены. Друг может поднять вас клавишей V.' : message.playerLost };
  });
  const revivePlayer = () => setGame((state) => state.playerHealth > 0 ? state : ({ ...state, playerHealth: 50, message: 'Друг вылечил вас. Здоровье восстановлено до 50.' }));
  const payReviveCost = () => setGame((state) => ({ ...state, playerHealth: Math.max(1, Math.ceil(state.playerHealth / 2)), message: 'Вы отдали половину здоровья, чтобы спасти друга.' }));
  const damageBase = (damage: number) => setGame((state) => {
    if (state.phase !== 'night') return state;
    const baseHealth = Math.max(0, state.baseHealth - damage);
    return { ...state, baseHealth, phase: baseHealth ? state.phase : 'lost', message: baseHealth ? message.baseHit(damage) : message.baseLost };
  });
  const finishNight = () => setGame((state) => {
    if (state.phase !== 'night') return state;
    if (state.day === state.maxNights) return { ...state, phase: 'won', message: message.won, completionTime: Math.floor((Date.now() - startedAt.current - pausedTime.current) / 1000) };
    return { ...state, day: state.day + 1, phase: 'day', message: message.newDay };
  });
  const restart = () => setGame(initialState);
  const dropResource = (kind: ResourceKind) => setGame((state) => {
    if (kind === 'spear') return state.hasSpear ? { ...state, hasSpear: false, weapon: state.weapon === 'spear' ? 'hammer' : state.weapon } : state;
    if (kind === 'wrench') return state.hasWrench ? { ...state, hasWrench: false, weapon: state.weapon === 'wrench' ? 'hammer' : state.weapon } : state;
    return { ...state, [kind]: Math.max(0, state[kind] - 1) };
  });
  const receiveResource = (kind: ResourceKind) => setGame((state) => {
    if (kind === 'spear') return { ...state, hasSpear: true };
    if (kind === 'wrench') return { ...state, hasWrench: true, hasSeenWrench: true, weapon: 'wrench' };
    return { ...state, [kind]: state[kind] + 1 };
  });
  const syncSharedGame = useCallback((shared: SharedGame) => setGame((state) => {
    const { paused: _paused, ...nextGame } = shared;
    return { ...state, ...nextGame };
  }), []);
  const pauseClock = useCallback(() => { pausedAt.current ??= Date.now(); }, []);
  const resumeClock = useCallback(() => {
    if (!pausedAt.current) return;
    pausedTime.current += Date.now() - pausedAt.current;
    pausedAt.current = undefined;
  }, []);

  return { game, startGame, gatherWood, gatherCrateLoot, gatherFood, gatherWater, eatFood, drinkWater, dropResource, receiveResource, interactionUnavailable, attack, buySpear, buyAxe, switchWeapon, repairBase, applyTeammateRepair, startNight, damagePlayer, revivePlayer, payReviveCost, damageBase, finishNight, restart, syncSharedGame, pauseClock, resumeClock };
}
