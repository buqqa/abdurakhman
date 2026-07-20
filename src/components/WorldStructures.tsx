import type { WorldStructure } from '../game/structures';

export function WorldStructures({ structures }: { structures: WorldStructure[] }) {
  return structures.map((structure) => structure.kind === 'tent' ? (
    <div className="abandoned-tent" style={{ left: structure.x, top: structure.y }} aria-label="Заброшенная палатка" key={structure.id}>
      <span className="tent-ground-shadow" /><span className="tent-side tent-side--left" /><span className="tent-side tent-side--right" />
      <span className="tent-roof" /><span className="tent-ridge" /><span className="tent-door" />
      <span className="tent-web"><i /><i /><i /></span>
    </div>
  ) : structure.kind === 'warehouse' ? (
    <div className="abandoned-warehouse" style={{ left: structure.x, top: structure.y }} aria-label="Заброшенный склад" key={structure.id}>
      <span className="warehouse-roof" /><span className="warehouse-door" />
      <span className="warehouse-window" /><span className="warehouse-sign">СКЛАД</span>
      <span className="tent-web warehouse-web warehouse-web--left"><i /><i /><i /></span>
      <span className="tent-web warehouse-web warehouse-web--right"><i /><i /><i /></span>
    </div>
  ) : (
    <div className="abandoned-car" style={{ left: structure.x, top: structure.y }} aria-label="Заброшенный автомобиль" key={structure.id}>
      <span className="car-ground-shadow" /><span className="car-body" /><span className="car-roof" />
      <span className="car-trunk"><i /></span>
      <span className="car-window car-window--front" /><span className="car-window car-window--back" />
      <span className="car-door" /><span className="car-bumper" />
      <span className="car-wheel car-wheel--front"><i /></span><span className="car-wheel car-wheel--back"><i /></span>
      <span className="tent-web car-web"><i /><i /><i /></span>
    </div>
  ));
}
