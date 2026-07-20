import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type ControlAction = 'up' | 'down' | 'left' | 'right' | 'attack' | 'startNight' | 'revive' | 'switchWeapon' | 'repair' | 'interact';
export type ControlBindings = Record<ControlAction, string>;

export const DEFAULT_CONTROLS: ControlBindings = {
  up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', attack: 'Mouse0',
  startNight: 'Space', revive: 'KeyV', switchWeapon: 'KeyQ', repair: 'Mouse2', interact: 'KeyE',
};

interface ControlsValue {
  bindings: ControlBindings;
  setBinding: (action: ControlAction, code: string) => void;
  resetBindings: () => void;
}

const ControlsContext = createContext<ControlsValue | undefined>(undefined);

function loadBindings(): ControlBindings {
  try {
    const saved = JSON.parse(localStorage.getItem('forest-controls') ?? '{}') as Partial<ControlBindings>;
    return { ...DEFAULT_CONTROLS, ...saved };
  } catch {
    return DEFAULT_CONTROLS;
  }
}

export function ControlsProvider({ children }: { children: ReactNode }) {
  const [bindings, setBindings] = useState(loadBindings);
  const value = useMemo<ControlsValue>(() => ({
    bindings,
    setBinding: (action, code) => setBindings((current) => {
      const duplicate = (Object.keys(current) as ControlAction[]).find((item) => item !== action && current[item] === code);
      const next = { ...current, [action]: code };
      if (duplicate) next[duplicate] = current[action];
      localStorage.setItem('forest-controls', JSON.stringify(next));
      return next;
    }),
    resetBindings: () => {
      localStorage.setItem('forest-controls', JSON.stringify(DEFAULT_CONTROLS));
      setBindings(DEFAULT_CONTROLS);
    },
  }), [bindings]);
  return <ControlsContext.Provider value={value}>{children}</ControlsContext.Provider>;
}

export function useControls() {
  const value = useContext(ControlsContext);
  if (!value) throw new Error('useControls must be used inside ControlsProvider');
  return value;
}

export function controlLabel(code: string) {
  if (code === 'Mouse0') return 'ЛКМ';
  if (code === 'Mouse1') return 'СКМ';
  if (code === 'Mouse2') return 'ПКМ';
  if (code === 'Space') return 'Space';
  return code.replace(/^Key/, '').replace(/^Digit/, '');
}
