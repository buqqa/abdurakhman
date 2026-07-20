import type { Position } from './PlayerController';
import { SPEAR_COST } from '../game/config';
import { useI18n } from '../i18n/I18nContext';
import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import { useControls } from '../game/controls';

export const MERCHANT_POSITION = { x: 1125, y: 635 } as const;
const TRADE_DISTANCE = 111;

interface Props { player: Position; wood: number; isOpen: boolean; onOpen: () => void; onClose: () => void; onBuy: () => void }

export function Merchant({ player, wood, isOpen, onOpen, onClose, onBuy }: Props) {
  const { bindings } = useControls();
  const { language } = useI18n();
  const text = language === 'en'
    ? { name: 'Merchant', title: 'Forest merchant', offer: 'Spear', buff: 'Increased attack range and damage', penalty: 'Takes more hits to chop down a tree', buy: 'Trade for 50 wood' }
    : language === 'kk'
      ? { name: 'Саудагер', title: 'Орман саудагері', offer: 'Найза', buff: 'Шабуыл қашықтығы мен зақымы артқан', penalty: 'Ағашты шабуға көбірек соққы қажет', buy: '50 ағашқа айырбастау' }
      : { name: 'Торговец', title: 'Лесной торговец', offer: 'Копьё', buff: 'Увеличенный радиус и урон', penalty: 'Для добычи дерева нужно больше ударов', buy: 'Обменять на 50 дерева' };
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
      <div className="trade-offer"><span className="trade-spear"><i /></span><div><p>{text.buff}</p><p className="trade-penalty">{text.penalty}</p></div></div>
      <button className="trade-buy" disabled={wood < SPEAR_COST} onClick={() => { onBuy(); if (wood >= SPEAR_COST) onClose(); }}>
        {text.buy} <strong>({wood}/{SPEAR_COST})</strong>
      </button>
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
