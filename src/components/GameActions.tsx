import type { Phase } from '../game/types';
import { useI18n } from '../i18n/I18nContext';

interface Props {
  phase: Phase;
  onRestart: () => void;
}

export function GameActions(props: Props) {
  const { t } = useI18n();
  if (props.phase === 'won' || props.phase === 'lost') return <button onClick={props.onRestart}>{t('restart')}</button>;
  if (props.phase === 'night') return <button disabled>{t('wave')}</button>;
  return null;
}
