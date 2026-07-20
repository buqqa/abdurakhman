import type { Zombie } from '../game/zombies';

export function ZombieSprite({ zombie, dying = false }: { zombie: Zombie; dying?: boolean }) {
  const health = zombie.health / zombie.maxHealth * 100;
  const wasHit = Date.now() - zombie.hitAt < 180;
  const isSpawning = Date.now() - zombie.spawnedAt < (zombie.isBoss ? 1500 : 1000);
  return (
    <div className={`map-zombie ${dying ? 'map-zombie--dying' : ''} ${zombie.facingLeft ? 'map-zombie--left' : ''} ${zombie.isBoss ? 'map-zombie--boss' : ''} ${zombie.isSprinter ? 'map-zombie--sprinter' : ''} ${zombie.isArmored ? 'map-zombie--armored' : ''} ${wasHit ? 'map-zombie--hit' : ''} ${isSpawning ? 'map-zombie--spawning' : ''}`} style={{ transform: `translate(${zombie.x - 15}px, ${zombie.y - 18}px)` }}>
      {!dying && <span className="zombie-health"><i style={{ width: `${health}%` }} /></span>}
      <span className="zombie-sprite"><span className="zombie-arm zombie-arm--top">
        {zombie.hasHammer && <span className="zombie-hammer" aria-hidden="true"><i /></span>}
        {zombie.isExplosive && <span className="zombie-tnt" aria-hidden="true">TNT</span>}
        {zombie.isBoss && <span className="zombie-staff" aria-hidden="true"><i /></span>}
      </span><span className="zombie-arm zombie-arm--bottom" />
        {zombie.isSprinter && <span className="zombie-headband" aria-hidden="true" />}
        <span className="zombie-head"><i /><b />{zombie.guardX !== undefined && <span className="zombie-driver-cap" />}{zombie.isArmored && <span className="zombie-helmet" />}</span>
        <span className="zombie-body">{zombie.isArmored && <i className="zombie-chestplate" />}</span>
        <span className="zombie-leg zombie-leg--one" /><span className="zombie-leg zombie-leg--two" />
      </span>
      {zombie.isBoss && <strong>BOSS</strong>}
    </div>
  );
}
