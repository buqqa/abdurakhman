import type { Position } from './PlayerController';
import { AXE_COST, SPEAR_COST } from '../game/config';
import { useI18n } from '../i18n/I18nContext';
import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import { useControls } from '../game/controls';

export const MERCHANT_POSITION = { x: 1125, y: 635 } as const;
const TRADE_DISTANCE = 111;

interface Props { player: Position; wood: number; hasSpear: boolean; hasAxe: boolean; isOpen: boolean; onOpen: () => void; onClose: () => void; onBuySpear: () => void; onBuyAxe: () => void }

export function Merchant({ player, wood, hasSpear, hasAxe, isOpen, onOpen, onClose, onBuySpear, onBuyAxe }: Props) {
  const { bindings } = useControls();
  const { language } = useI18n();
  const text = language === 'en'
    ? { name: 'Merchant', title: 'Forest merchant', offer: 'Weapons', spear: 'Spear', spearBuff: 'Increased attack range and damage', spearPenalty: 'Takes 4 hits to fell a tree', axe: 'Axe', axeBuff: 'Gathers wood and kills zombies faster', axePenalty: 'Attack cooldown: 0.7 seconds', buy: 'Trade for 50 wood', owned: 'Owned' }
    : language === 'kk'
      ? { name: 'Саудагер', title: 'Орман саудагері', offer: 'Қару-жарақ', spear: 'Найза', spearBuff: 'Шабуыл қашықтығы мен зақымы артқан', spearPenalty: 'Ағашты шабуға 4 соққы қажет', axe: 'Балта', axeBuff: 'Ағашты тезірек жинап, зомбилерді тезірек өлтіреді', axePenalty: 'Соққы кідірісі: 0,7 секунд', buy: '50 ағашқа айырбастау', owned: 'Сатып алынды' }
      : { name: 'Торговец', title: 'Лесной торговец', offer: 'Оружие', spear: 'Копьё', spearBuff: 'Увеличенный радиус и урон', spearPenalty: 'Для добычи дерева нужно 4 удара', axe: 'Топор', axeBuff: 'Быстрее добывает дерево и убивает зомби', axePenalty: 'Задержка между ударами: 0,7 секунды', buy: 'Обменять на 50 дерева', owned: 'Куплено' };
  const isNear = Math.hypot(player.x - MERCHANT_POSITION.x, player.y - MERCHANT_POSITION.y) <= TRADE_DISTANCE;
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
      </div>
    </section>
  </div>, document.body) : null;
  return <>
    <div className="merchant" style={{ left: MERCHANT_POSITION.x, top: MERCHANT_POSITION.y }}>
      <span className="merchant__name">{text.name}</span><span className="merchant__sprite"><span className="merchant__hair" />
        <span className="merchant__head"><i /></span><span className="merchant__arm merchant__arm--left" />
        <span className="merchant__body" /><span className="merchant__arm merchant__arm--right" />
        <span className="merchant__legs" /><span className="merchant__pack" /></span>
    </div>
    {tradeWindow}
  </>;
}
