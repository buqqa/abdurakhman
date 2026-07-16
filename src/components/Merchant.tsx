import type { Position } from './PlayerController';
import { SPEAR_COST } from '../game/config';
import { useI18n } from '../i18n/I18nContext';
import { createPortal } from 'react-dom';

export const MERCHANT_POSITION = { x: 1125, y: 635 } as const;
const TRADE_DISTANCE = 111;

interface Props { player: Position; wood: number; isOpen: boolean; onOpen: () => void; onClose: () => void; onBuy: () => void }

export function Merchant({ player, wood, isOpen, onOpen, onClose, onBuy }: Props) {
  const { language } = useI18n();
  const text = language === 'en'
    ? { name: 'Merchant', title: 'Forest merchant', offer: 'Spear', buff: '+25% attack range and damage', penalty: '25% slower wood gathering', buy: 'Trade for 50 wood' }
    : language === 'kk'
      ? { name: 'Саудагер', title: 'Орман саудагері', offer: 'Найза', buff: '+25% шабуыл қашықтығы мен зақым', penalty: 'Ағаш шабу 25% баяу', buy: '50 ағашқа айырбастау' }
      : { name: 'Торговец', title: 'Лесной торговец', offer: 'Копьё', buff: '+25% к радиусу и урону', penalty: 'Добыча дерева на 25% медленнее', buy: 'Обменять на 50 дерева' };
  const isNear = Math.hypot(player.x - MERCHANT_POSITION.x, player.y - MERCHANT_POSITION.y) <= TRADE_DISTANCE;
  const tradeWindow = isOpen ? createPortal(<div className="trade-backdrop" onContextMenu={(event) => event.preventDefault()} onClick={onClose}>
    <section className="trade-window" onClick={(event) => event.stopPropagation()}>
      <header><div><small>{text.title}</small><h2>{text.offer}</h2></div><button onClick={onClose}>×</button></header>
      <div className="trade-offer"><span className="trade-spear"><i /></span><div><p>{text.buff}</p><p className="trade-penalty">{text.penalty}</p></div></div>
      <button className="trade-buy" disabled={wood < SPEAR_COST} onClick={() => { onBuy(); if (wood >= SPEAR_COST) onClose(); }}>
        {text.buy} <strong>({wood}/{SPEAR_COST})</strong>
      </button>
    </section>
  </div>, document.body) : null;
  return <>
    <div className="merchant" style={{ left: MERCHANT_POSITION.x, top: MERCHANT_POSITION.y }}
      onPointerDown={(event) => { if (event.button === 0) event.stopPropagation(); }}
      onClick={() => { if (isNear) onOpen(); }}>
      <span className="merchant__name">{text.name}</span><span className="merchant__sprite"><span className="merchant__hair" />
        <span className="merchant__head"><i /></span><span className="merchant__arm merchant__arm--left" />
        <span className="merchant__body" /><span className="merchant__arm merchant__arm--right" />
        <span className="merchant__legs" /><span className="merchant__pack" /></span>
    </div>
    {tradeWindow}
  </>;
}
