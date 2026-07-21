import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { WaterBottle } from './WaterBottle';
import { ChickenLeg } from './ChickenLeg';
import type { ResourceKind } from '../game/multiplayer';
import { WeaponItem } from './WeaponItem';

interface Props {
  wood: number;
  food: number;
  water: number;
  hasSpear: boolean;
  hasWrench: boolean;
  onEat: () => void;
  onDrink: () => void;
  onDrop?: (kind: ResourceKind) => void;
}

export function InventoryPanel({ wood, food, water, hasSpear, hasWrench, onEat, onDrink, onDrop }: Props) {
  const { t, language } = useI18n();
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
    return () => { window.removeEventListener('keydown', toggleInventory); window.clearTimeout(holdTimer.current); };
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
          {hasSpear && <div className="inventory-slot" onPointerDown={() => startHold('spear', 1)} onPointerUp={stopHold} onPointerLeave={stopHold}><WeaponItem kind="spear" /><p>Копьё</p><strong>1</strong></div>}
          {hasWrench && <div className="inventory-slot" onPointerDown={() => startHold('wrench', 1)} onPointerUp={stopHold} onPointerLeave={stopHold}><WeaponItem kind="wrench" /><p>Гаечный ключ</p><strong>1</strong></div>}
        </div>
        <p className="inventory-help">{onDrop ? language === 'en' ? 'Hold an item to share it.' : language === 'kk' ? 'Бөлісу үшін затты басып тұр.' : 'Зажми предмет, чтобы поделиться им.' : t('inventoryHelp')}</p>
      </section>
    </div>
  );
}
