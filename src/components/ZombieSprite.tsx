import type { Zombie } from '../game/zombies';

export function ZombieSprite({ zombie }: { zombie: Zombie }) {
  const health = zombie.health / zombie.maxHealth * 100;
  const wasHit = performance.now() - zombie.hitAt < 180;
  return (
    <div className={`map-zombie ${zombie.facingLeft ? 'map-zombie--left' : ''} ${wasHit ? 'map-zombie--hit' : ''}`} style={{ transform: `translate(${zombie.x - 15}px, ${zombie.y - 18}px)` }}>
      <span className="zombie-health"><i style={{ width: `${health}%` }} /></span>
      <span className="zombie-sprite"><span className="zombie-arm zombie-arm--top" /><span className="zombie-arm zombie-arm--bottom" />
        {zombie.hasAxe && <span className="zombie-axe" aria-hidden="true" />}
        <span className="zombie-head"><i /><b /></span><span className="zombie-body" />
        <span className="zombie-leg zombie-leg--one" /><span className="zombie-leg zombie-leg--two" />
        {zombie.isBoss && <span className="zombie-crown" aria-hidden="true">♛</span>}
      </span>
      {zombie.isBoss && <strong>BOSS</strong>}
    </div>
  );
}
