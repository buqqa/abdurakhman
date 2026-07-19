import type { InteractableObject } from '../game/interactions';

interface Props {
  crate: InteractableObject;
  animation?: 'hit' | 'break';
}

export function LootCrate({ crate, animation }: Props) {
  return (
    <div className={`loot-crate ${animation ? `loot-crate--${animation}` : ''}`}
      style={{ left: crate.x - 18, top: crate.y - 15 }} aria-label="Ящик с припасами">
      <span className="loot-crate__lid" /><span className="loot-crate__plank" />
    </div>
  );
}
