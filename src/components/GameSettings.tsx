import { useEffect, useRef, useState } from 'react';
import { controlLabel, type ControlAction, useControls } from '../game/controls';
import { useI18n } from '../i18n/I18nContext';
import { LobbySettings } from './LobbySettings';

const actions: ControlAction[] = ['up', 'down', 'left', 'right', 'attack', 'startNight', 'revive', 'switchWeapon', 'repair', 'interact'];
const labels = {
  ru: ['Вверх', 'Вниз', 'Влево', 'Вправо', 'Атака', 'Начать ночь', 'Вылечить', 'Сменить оружие', 'Ремонт', 'Взаимодействие'],
  kk: ['Жоғары', 'Төмен', 'Солға', 'Оңға', 'Шабуыл', 'Түнді бастау', 'Емдеу', 'Қаруды ауыстыру', 'Жөндеу', 'Әрекет'],
  en: ['Move up', 'Move down', 'Move left', 'Move right', 'Attack', 'Start night', 'Revive', 'Switch weapon', 'Repair', 'Interact'],
} as const;

export function GameSettings({ onBack }: { onBack: () => void }) {
  const { language } = useI18n();
  const { bindings, setBinding, resetBindings } = useControls();
  const [waiting, setWaiting] = useState<ControlAction>();
  const suppressBindingClickUntil = useRef(0);
  const text = language === 'en' ? { title: 'Settings', press: 'Press a key or mouse button', reset: 'Reset controls', back: 'Back' }
    : language === 'kk' ? { title: 'Баптаулар', press: 'Пернені немесе тінтуір батырмасын бас', reset: 'Басқаруды қалпына келтіру', back: 'Артқа' }
      : { title: 'Настройки', press: 'Нажми клавишу или кнопку мыши', reset: 'Сбросить управление', back: 'Назад' };

  useEffect(() => {
    if (!waiting) return;
    const bindKey = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.code === 'Escape') return setWaiting(undefined);
      setBinding(waiting, event.code);
      setWaiting(undefined);
    };
    const bindMouse = (event: MouseEvent) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (waiting !== 'attack' && waiting !== 'repair') return;
      suppressBindingClickUntil.current = performance.now() + 350;
      setBinding(waiting, `Mouse${event.button}`);
      setWaiting(undefined);
    };
    window.addEventListener('keydown', bindKey, true);
    window.addEventListener('mousedown', bindMouse, true);
    return () => { window.removeEventListener('keydown', bindKey, true); window.removeEventListener('mousedown', bindMouse, true); };
  }, [setBinding, waiting]);

  return <section className="game-settings">
    <h2>{text.title}</h2>
    <LobbySettings />
    <div className="controls-settings">{actions.map((action, index) => <label key={action}>
      <span>{labels[language][index]}</span>
      <button className={waiting === action ? 'active' : ''} onClick={() => { if (performance.now() >= suppressBindingClickUntil.current) setWaiting(action); }}>
        {waiting === action ? text.press : controlLabel(bindings[action])}
      </button>
    </label>)}</div>
    <button onClick={resetBindings}>{text.reset}</button>
    <button onClick={onBack}>{text.back}</button>
  </section>;
}
