import { useEffect, useState } from 'react';

interface Props {
  wood: number;
  food: number;
  water: number;
  onEat: () => void;
  onDrink: () => void;
}

export function InventoryPanel({ wood, food, water, onEat, onDrink }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const toggleInventory = (event: KeyboardEvent) => {
      if (event.code === 'KeyB' && !event.repeat) setIsOpen((open) => !open);
      if (event.code === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', toggleInventory);
    return () => window.removeEventListener('keydown', toggleInventory);
  }, []);

  if (!isOpen) return <div className="inventory-hint">B — инвентарь</div>;

  return (
    <div className="inventory-backdrop" onClick={() => setIsOpen(false)}>
      <section className="inventory" onClick={(event) => event.stopPropagation()} aria-label="Инвентарь">
        <header><h2>Инвентарь</h2><button className="small" onClick={() => setIsOpen(false)}>Закрыть</button></header>
        <div className="inventory-grid">
          <div className="inventory-slot"><span>🪵</span><p>Дерево</p><strong>{wood}</strong></div>
          <div className="inventory-slot"><span>🍗</span><p>Еда</p><strong>{food}</strong><button className="use-item" disabled={food === 0} onClick={onEat}>Съесть</button></div>
          <div className="inventory-slot"><span>💧</span><p>Вода</p><strong>{water}</strong><button className="use-item" disabled={water === 0} onClick={onDrink}>Выпить</button></div>
        </div>
        <p className="inventory-help">F — построить забор за 2 дерева. B или Escape — закрыть.</p>
      </section>
    </div>
  );
}
