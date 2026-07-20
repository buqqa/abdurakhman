interface Props { enabled: boolean; canStartNight: boolean; canPause: boolean; onStartNight: () => void; onPause: () => void }

type IconKind = 'backpack' | 'interact' | 'repair' | 'attack' | 'revive' | 'night' | 'pause';

function MobileIcon({ kind }: { kind: IconKind }) {
  if (kind === 'backpack') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7V5c0-2 1.5-3 4-3s4 1 4 3v2M6 8h12c1.1 0 2 .9 2 2v10H4V10c0-1.1.9-2 2-2Zm2 6h8v6H8v-6ZM4 12H2v5h2m16-5h2v5h-2" /></svg>;
  if (kind === 'interact') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11V5a2 2 0 0 1 4 0v5-3a2 2 0 0 1 4 0v4-2a2 2 0 0 1 4 0v5c0 5-3 8-8 8h-1c-3 0-5-2-7-5l-2-3a2 2 0 0 1 3-2l3 3" /></svg>;
  if (kind === 'repair') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5 5-3 3 3-3 5-3-3-8 8 2 2-4 4-3-3 4-4 2 2 8-8-3-3Z" /></svg>;
  if (kind === 'revive') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21S4 16.5 4 9.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8 3.5C20 16.5 12 21 12 21Z" /><path d="M12 8v7m-3.5-3.5h7" /></svg>;
  if (kind === 'night') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" /></svg>;
  if (kind === 'pause') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h4v16H7zM14 4h4v16h-4z" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 3 7-2-2 7L9 18l-3-3L16 5M8 17l-4 4-2-2 4-4m10-3 3 3" /></svg>;
}

function sendKey(code: string, type: 'keydown' | 'keyup') {
  window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
}

function DirectionButton({ code, label, direction, enabled }: { code: string; label: string; direction: 'up' | 'left' | 'right' | 'down'; enabled: boolean }) {
  const release = () => sendKey(code, 'keyup');
  return <button className={`mobile-direction mobile-direction--${direction}`} disabled={!enabled}
    onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); sendKey(code, 'keydown'); }}
    onPointerUp={release} onPointerCancel={release}>{label}</button>;
}

export function MobileControls({ enabled, canStartNight, canPause, onStartNight, onPause }: Props) {
  const { bindings } = useControls();
  const attack = () => {
    if (!bindings.attack.startsWith('Mouse')) return sendKey(bindings.attack, 'keydown');
    const viewport = document.querySelector('.map-viewport');
    viewport?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: Number(bindings.attack.slice(5)), pointerId: 1, pointerType: 'touch', isPrimary: true }));
  };
  const repair = () => bindings.repair.startsWith('Mouse')
    ? document.querySelector('.base')?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: Number(bindings.repair.slice(5)) }))
    : sendKey(bindings.repair, 'keydown');
  return <aside className="mobile-controls" aria-label="Мобильное управление">
    {canPause && <button className="mobile-pause" disabled={!enabled} onClick={onPause} aria-label="Пауза"><MobileIcon kind="pause" /></button>}
    <div className="mobile-joystick">
      <DirectionButton code={bindings.up} label="↑" direction="up" enabled={enabled} /><DirectionButton code={bindings.left} label="←" direction="left" enabled={enabled} />
      <span className="mobile-joystick__center" /><DirectionButton code={bindings.right} label="→" direction="right" enabled={enabled} />
      <DirectionButton code={bindings.down} label="↓" direction="down" enabled={enabled} />
    </div>
    <div className="mobile-actions">
      <button className="mobile-interact" disabled={!enabled} onClick={() => sendKey(bindings.interact, 'keydown')} aria-label="Взаимодействовать"><MobileIcon kind="interact" /></button>
      <button className="mobile-inventory" disabled={!enabled} onClick={() => sendKey('KeyB', 'keydown')} aria-label="Открыть инвентарь"><MobileIcon kind="backpack" /></button>
      <button className="mobile-repair" disabled={!enabled} onClick={repair} aria-label="Ремонт базы"><MobileIcon kind="repair" /></button>
      <button className="mobile-revive" disabled={!enabled} onClick={() => sendKey(bindings.revive, 'keydown')} aria-label="Вылечить союзника"><MobileIcon kind="revive" /></button>
      {canStartNight && <button className="mobile-night" disabled={!enabled} onClick={onStartNight} aria-label="Начать ночь"><MobileIcon kind="night" /></button>}
      <button className="mobile-attack" disabled={!enabled} onPointerDown={(event) => { event.preventDefault(); attack(); }} aria-label="Удар"><MobileIcon kind="attack" /></button>
    </div>
  </aside>;
}
import { useControls } from '../game/controls';
