import { useEffect, useRef, useState } from 'react';
import { playGameSound } from '../lib/gameAudio';

interface Props { health: number; x: number; y: number }

export function BaseStructure({ health, x, y }: Props) {
  const damage = health === 100 ? 'safe' : health > 50 ? 'damaged' : 'critical';
  const previousHealth = useRef(health);
  const [isRepairing, setIsRepairing] = useState(false);
  const [isHit, setIsHit] = useState(false);
  const repairCount = useRef(0);
  const [repairSide, setRepairSide] = useState<'left' | 'right' | 'top'>('right');

  useEffect(() => {
    if (health > previousHealth.current) {
      playGameSound('repair');
      const sides = ['left', 'right', 'top'] as const;
      setRepairSide(sides[repairCount.current % sides.length]);
      repairCount.current += 1;
      setIsRepairing(true);
      const timer = window.setTimeout(() => setIsRepairing(false), 650);
      previousHealth.current = health;
      return () => window.clearTimeout(timer);
    }
    if (health < previousHealth.current) {
      setIsHit(true);
      const timer = window.setTimeout(() => setIsHit(false), 430);
      previousHealth.current = health;
      return () => window.clearTimeout(timer);
    }
    previousHealth.current = health;
  }, [health]);

  return (
    <div className={`base base--${damage} ${isHit ? 'base--hit' : ''} ${isRepairing ? `base--repairing base--repair-${repairSide}` : ''}`}
      style={{ left: x, top: y }} aria-label={`База, прочность ${health}%`}>
      <span className="base__tower base__tower--left" /><span className="base__tower base__tower--right" />
      <span className="base__wall" /><span className="base__battlements" />
      <span className="base__door"><i className="base__door-print">▲</i></span><span className="base__step" />
      <span className="base__plank base__plank--one" /><span className="base__plank base__plank--two" />
      <span className="base__crack base__crack--one" /><span className="base__crack base__crack--two" />
      <span className="base__dust">•••</span>
      <span className="base__repair-tool">🪓</span><span className="base__repair-spark">✦</span>
    </div>
  );
}
