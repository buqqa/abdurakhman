import type { Position } from './PlayerController';
import { SPEAR_COST } from '../game/config';
import { useI18n } from '../i18n/I18nContext';
import { createPortal } from 'react-dom';

export const MERCHANT_POSITION = { x: 1125, y: 635 } as const;
const TRADE_DISTANCE = 85;

interface Props { player: Position; wood: number; isOpen: boolean; onOpen: () => void; onClose: () => void; onBuy: () => void }

export function Merchant({ player, wood, isOpen, onOpen, onClose, onBuy }: Props) {
  const { language } = useI18n();
  const text = language === 'en'
    ? { name: 'Merchant', hint: 'RMB — trade', title: 'Forest merchant', offer: 'Spear', details: '+10% attack range and damage · 10% slower wood gathering', buy: 'Trade for 50 wood', far: 'Come closer to trade' }
    : language === 'kk'
      ? { name: 'Саудагер', hint: 'ОЖБ — айырбас', title: 'Орман саудагері', offer: 'Найза', details: '+10% шабуыл қашықтығы мен зақым · ағаш шабу 10% баяу', buy: '50 ағашқа айырбастау', far: 'Айырбас үшін жақында' }
      : { name: 'Торговец', hint: 'ПКМ — обмен', title: 'Лесной торговец', offer: 'Копьё', details: '+10% к радиусу и урону · добыча дерева на 10% медленнее', buy: 'Обменять на 50 дерева', far: 'Подойди ближе для обмена' };
  const isNear = Math.hypot(player.x - MERCHANT_POSITION.x, player.y - MERCHANT_POSITION.y) <= TRADE_DISTANCE;
  const tradeWindow = isOpen ? createPortal(<div className="trade-backdrop" onContextMenu={(event) => event.preventDefault()} onClick={onClose}>
    <section className="trade-window" onClick={(event) => event.stopPropagation()}>
      <header><div><small>{text.title}</small><h2>{text.offer}</h2></div><button onClick={onClose}>×</button></header>
      <div className="trade-offer"><span className="trade-spear"><i /></span><p>{text.details}</p></div>
      <button className="trade-buy" disabled={wood < SPEAR_COST} onClick={() => { onBuy(); if (wood >= SPEAR_COST) onClose(); }}>
        {text.buy} <strong>({wood}/{SPEAR_COST})</strong>
      </button>
    </section>
  </div>, document.body) : null;
  return <>
    <div className="merchant" style={{ left: MERCHANT_POSITION.x, top: MERCHANT_POSITION.y }} onContextMenu={(event) => { event.preventDefault(); if (isNear) onOpen(); }}>
      <span className="merchant__name">{text.name}</span><span className="merchant__head" /><span className="merchant__body" />
      <span className="merchant__pack" /><span className="merchant__hint">{isNear ? text.hint : text.far}</span>
    </div>
    {tradeWindow}
  </>;
}
