import type { Position } from './PlayerController';
import { AXE_COST, SPEAR_COST, SWORD_COST } from '../game/config';
import { useI18n } from '../i18n/I18nContext';
import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import { useControls } from '../game/controls';

const TRADE_DISTANCE = 111;

interface Props { player: Position; position: Position; wood: number; hasSpear: boolean; hasAxe: boolean; hasSword: boolean; isOpen: boolean; onOpen: () => void; onClose: () => void; onBuySpear: () => void; onBuyAxe: () => void; onBuySword: () => void }

export function Merchant({ player, position, wood, hasSpear, hasAxe, hasSword, isOpen, onOpen, onClose, onBuySpear, onBuyAxe, onBuySword }: Props) {
  const { bindings } = useControls();
  const { language } = useI18n();
  const text = language === 'en'
    ? { name: 'Merchant', title: 'Forest merchant', offer: 'Weapons', spear: 'Spear', spearBuff: 'Increased attack range and damage', spearPenalty: 'Takes 4 hits to fell a tree', axe: 'Axe', axeBuff: 'Gathers wood and kills zombies faster', axePenalty: 'Attack cooldown: 0.7 seconds', sword: 'Sword', swordBuff: 'Attacks faster and kills zombies', swordPenalty: 'Cannot gather wood', buy: 'Trade for 50 wood', swordBuy: 'Trade for 75 wood', owned: 'Owned' }
    : language === 'kk'
      ? { name: 'Саудагер', title: 'Орман саудагері', offer: 'Қару-жарақ', spear: 'Найза', spearBuff: 'Шабуыл қашықтығы мен зақымы артқан', spearPenalty: 'Ағашты шабуға 4 соққы қажет', axe: 'Балта', axeBuff: 'Ағашты тезірек жинап, зомбилерді тезірек өлтіреді', axePenalty: 'Соққы кідірісі: 0,7 секунд', sword: 'Қылыш', swordBuff: 'Тезірек шабуылдап, зомбилерді өлтіреді', swordPenalty: 'Ағаш өндірмейді', buy: '50 ағашқа айырбастау', swordBuy: '75 ағашқа айырбастау', owned: 'Сатып алынды' }
      : { name: 'Торговец', title: 'Лесной торговец', offer: 'Оружие', spear: 'Копьё', spearBuff: 'Увеличенный радиус и урон', spearPenalty: 'Для добычи дерева нужно 4 удара', axe: 'Топор', axeBuff: 'Быстрее добывает дерево и убивает зомби', axePenalty: 'Задержка между ударами: 0,7 секунды', sword: 'Меч', swordBuff: 'Быстрее атакует и убивает зомби', swordPenalty: 'Не добывает дерево', buy: 'Обменять на 50 дерева', swordBuy: 'Обменять на 75 дерева', owned: 'Куплено' };
  const isNear = Math.hypot(player.x - position.x, player.y - position.y) <= TRADE_DISTANCE;
  useEffect(() => {
    const handleTrade = (event: KeyboardEvent) => {
      if (event.code !== bindings.interact || event.repeat || !isNear) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onOpen();
    };
    window.addEventListener('keydown', handleTrade, true);
    return () => window.removeEventListener('keydown', handleTrade, true);
  }, [bindings.interact, isNear, onOpen]);
  const tradeWindow = isOpen ? createPortal(<div className="trade-backdrop" onContextMenu={(event) => event.preventDefault()} onClick={onClose}>
    <section className="trade-window" onClick={(event) => event.stopPropagation()}>
      <header><div><small>{text.title}</small><h2>{text.offer}</h2></div><button onClick={onClose}>×</button></header>
      <div className="trade-list">
        <div className={`trade-offer ${hasSpear ? 'trade-offer--owned' : ''}`}><span className="trade-spear"><i /></span><div><h3>{text.spear}</h3><p>{text.spearBuff}</p><p className="trade-penalty">{text.spearPenalty}</p>
          <button className="trade-buy" disabled={hasSpear || wood < SPEAR_COST} onClick={onBuySpear}>{hasSpear ? text.owned : text.buy} <strong>({wood}/{SPEAR_COST})</strong></button></div></div>
        <div className={`trade-offer ${hasAxe ? 'trade-offer--owned' : ''}`}><span className="trade-axe"><i /></span><div><h3>{text.axe}</h3><p>{text.axeBuff}</p><p className="trade-penalty">{text.axePenalty}</p>
          <button className="trade-buy" disabled={hasAxe || wood < AXE_COST} onClick={onBuyAxe}>{hasAxe ? text.owned : text.buy} <strong>({wood}/{AXE_COST})</strong></button></div></div>
        <div className={`trade-offer ${hasSword ? 'trade-offer--owned' : ''}`}><span className="trade-sword"><i /></span><div><h3>{text.sword}</h3><p className="trade-buff">{text.swordBuff}</p><p className="trade-penalty">{text.swordPenalty}</p>
          <button className="trade-buy" disabled={hasSword || wood < SWORD_COST} onClick={onBuySword}>{hasSword ? text.owned : text.swordBuy} <strong>({wood}/{SWORD_COST})</strong></button></div></div>
      </div>
    </section>
  </div>, document.body) : null;
  return <>
    <div className="merchant" style={{ left: position.x, top: position.y }}>
      <span className="merchant__name">{text.name}</span><span className="merchant__sprite"><span className="merchant__hair" />
        <span className="merchant__head"><i /></span><span className="merchant__arm merchant__arm--left" />
        <span className="merchant__body" /><span className="merchant__arm merchant__arm--right" />
        <span className="merchant__legs" /><span className="merchant__pack" /></span>
    </div>
    {tradeWindow}
  </>;
}
