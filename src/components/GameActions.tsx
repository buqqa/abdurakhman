import type { Phase } from '../game/types';
import { useI18n } from '../i18n/I18nContext';

interface Props {
  phase: Phase;
  onNext: () => void;
  onRestart: () => void;
  canStart?: boolean;
}

export function GameActions(props: Props) {
  const { t } = useI18n();
  if (props.phase === 'won' || props.phase === 'lost') return <button onClick={props.onRestart}>{t('restart')}</button>;
  if (props.phase === 'night') return <button disabled>{t('wave')}</button>;
  return <button className="danger" disabled={props.canStart === false} onClick={props.onNext}>{t('startNight')}</button>;
}
