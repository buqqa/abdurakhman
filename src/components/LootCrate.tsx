import type { InteractableObject } from '../game/interactions';

interface Props {
  crate: InteractableObject;
  animation?: 'hit' | 'break';
}

export function LootCrate({ crate, animation }: Props) {
  const marker = crate.kind === 'crate-food' ? '' : crate.kind === 'crate-water' ? '💧' : '▥';
  return (
    <div className={`loot-crate ${crate.kind === 'crate-food' ? 'loot-crate--food' : ''} ${animation ? `loot-crate--${animation}` : ''}`}
      style={{ left: crate.x - 18, top: crate.y - 15 }} aria-label="Ящик с припасами">
      <span className="loot-crate__lid" /><span className="loot-crate__plank" />
      {marker && <i>{marker}</i>}
    </div>
  );
}
