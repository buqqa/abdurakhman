import type { Phase } from '../game/types';

interface Props {
  phase: Phase;
  onNext: () => void;
  onRestart: () => void;
}

export function GameActions(props: Props) {
  if (props.phase === 'won' || props.phase === 'lost') return <button onClick={props.onRestart}>Начать заново</button>;
  if (props.phase === 'night') return <button disabled>Волна идёт…</button>;
  return <button className="danger" onClick={props.onNext}>Начать ночь</button>;
}
