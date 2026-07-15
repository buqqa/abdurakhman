interface Props {
  health: number;
}

const HEART_COUNT = 10;
const HEALTH_PER_HEART = 10;

export function PlayerStats({ health }: Props) {
  return (
    <section className="player-health" aria-label={`Здоровье: ${health / HEALTH_PER_HEART} из ${HEART_COUNT} сердец`}>
      <span className="player-health__label">Здоровье</span>
      <div className="hearts" aria-hidden="true">
        {Array.from({ length: HEART_COUNT }, (_, index) => {
          const healthInHeart = health - index * HEALTH_PER_HEART;
          const state = healthInHeart >= HEALTH_PER_HEART ? 'full' : healthInHeart > 0 ? 'half' : 'empty';
          return <span className={`heart heart--${state}`} key={index}>♥</span>;
        })}
      </div>
    </section>
  );
}
