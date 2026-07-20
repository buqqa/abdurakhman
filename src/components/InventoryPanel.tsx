import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { WaterBottle } from './WaterBottle';
import { ChickenLeg } from './ChickenLeg';
import type { ResourceKind } from '../game/multiplayer';

interface Props {
  wood: number;
  food: number;
  water: number;
  onEat: () => void;
  onDrink: () => void;
  onDrop?: (kind: ResourceKind) => void;
}

export function InventoryPanel({ wood, food, water, onEat, onDrink, onDrop }: Props) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const holdTimer = useRef<number>();
  const startHold = (kind: ResourceKind, count: number) => {
    if (!onDrop || count === 0) return;
    holdTimer.current = window.setTimeout(() => onDrop(kind), 600);
  };
  const stopHold = () => window.clearTimeout(holdTimer.current);

  useEffect(() => {
    const toggleInventory = (event: KeyboardEvent) => {
      if (event.code === 'KeyB' && !event.repeat) setIsOpen((open) => !open);
      if (event.code === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', toggleInventory);
    return () => window.removeEventListener('keydown', toggleInventory);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="inventory-backdrop" onClick={() => setIsOpen(false)}>
      <section className="inventory" onClick={(event) => event.stopPropagation()} aria-label="Инвентарь">
        <header><h2>{t('inventory')}</h2><button className="small" onClick={() => setIsOpen(false)}>{t('close')}</button></header>
        <div className="inventory-grid">
          <div className="inventory-slot" onPointerDown={() => startHold('wood', wood)} onPointerUp={stopHold} onPointerLeave={stopHold}><span>🪵</span><p>{t('wood')}</p><strong>{wood}</strong></div>
          <div className="inventory-slot" onPointerDown={() => startHold('food', food)} onPointerUp={stopHold} onPointerLeave={stopHold}><ChickenLeg className="inventory-chicken" /><p>{t('food')}</p><strong>{food}</strong><button className="use-item" disabled={food === 0} onClick={onEat}>{t('eat')}</button></div>
          <div className="inventory-slot" onPointerDown={() => startHold('water', water)} onPointerUp={stopHold} onPointerLeave={stopHold}><WaterBottle className="inventory-water-bottle" /><p>{t('water')}</p><strong>{water}</strong><button className="use-item" disabled={water === 0} onClick={onDrink}>{t('drink')}</button></div>
        </div>
        <p className="inventory-help">{t('inventoryHelp')}</p>
      </section>
    </div>
  );
}
