export interface Explosion {
  id: number;
  x: number;
  y: number;
}

export function ZombieExplosion({ explosion }: { explosion: Explosion }) {
  return (
    <span className="zombie-explosion" style={{ left: explosion.x, top: explosion.y }} aria-hidden="true">
      <i className="zombie-explosion__flash" />
      <i className="zombie-explosion__smoke" />
    </span>
  );
}
