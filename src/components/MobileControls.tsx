interface Props { enabled: boolean }

type IconKind = 'backpack' | 'interact' | 'repair' | 'attack' | 'revive';

function MobileIcon({ kind }: { kind: IconKind }) {
  if (kind === 'backpack') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7V5c0-2 1.5-3 4-3s4 1 4 3v2M6 8h12c1.1 0 2 .9 2 2v10H4V10c0-1.1.9-2 2-2Zm2 6h8v6H8v-6ZM4 12H2v5h2m16-5h2v5h-2" /></svg>;
  if (kind === 'interact') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11V5a2 2 0 0 1 4 0v5-3a2 2 0 0 1 4 0v4-2a2 2 0 0 1 4 0v5c0 5-3 8-8 8h-1c-3 0-5-2-7-5l-2-3a2 2 0 0 1 3-2l3 3" /></svg>;
  if (kind === 'repair') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5 5-3 3 3-3 5-3-3-8 8 2 2-4 4-3-3 4-4 2 2 8-8-3-3Z" /></svg>;
  if (kind === 'revive') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21S4 16.5 4 9.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8 3.5C20 16.5 12 21 12 21Z" /><path d="M12 8v7m-3.5-3.5h7" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 3 7-2-2 7L9 18l-3-3L16 5M8 17l-4 4-2-2 4-4m10-3 3 3" /></svg>;
}

function sendKey(code: string, type: 'keydown' | 'keyup') {
  window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
}

function DirectionButton({ code, label, enabled }: { code: string; label: string; enabled: boolean }) {
  const release = () => sendKey(code, 'keyup');
  return <button className={`mobile-direction mobile-direction--${label}`} disabled={!enabled}
    onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); sendKey(code, 'keydown'); }}
    onPointerUp={release} onPointerCancel={release} onPointerLeave={(event) => { if (event.buttons) release(); }}>{label}</button>;
}

export function MobileControls({ enabled }: Props) {
  const attack = () => {
    const viewport = document.querySelector('.map-viewport');
    viewport?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 1, pointerType: 'touch', isPrimary: true }));
  };
  const repair = () => document.querySelector('.base')?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 2 }));
  return <aside className="mobile-controls" aria-label="Мобильное управление">
    <div className="mobile-joystick">
      <DirectionButton code="KeyW" label="↑" enabled={enabled} /><DirectionButton code="KeyA" label="←" enabled={enabled} />
      <span className="mobile-joystick__center" /><DirectionButton code="KeyD" label="→" enabled={enabled} />
      <DirectionButton code="KeyS" label="↓" enabled={enabled} />
    </div>
    <div className="mobile-actions">
      <button className="mobile-interact" disabled={!enabled} onClick={() => sendKey('KeyE', 'keydown')} aria-label="Взаимодействовать"><MobileIcon kind="interact" /></button>
      <button className="mobile-inventory" disabled={!enabled} onClick={() => sendKey('KeyB', 'keydown')} aria-label="Открыть инвентарь"><MobileIcon kind="backpack" /></button>
      <button className="mobile-repair" disabled={!enabled} onClick={repair} aria-label="Ремонт базы"><MobileIcon kind="repair" /></button>
      <button className="mobile-revive" disabled={!enabled} onClick={() => sendKey('KeyV', 'keydown')} aria-label="Вылечить союзника"><MobileIcon kind="revive" /></button>
      <button className="mobile-attack" disabled={!enabled} onPointerDown={(event) => { event.preventDefault(); attack(); }} aria-label="Удар"><MobileIcon kind="attack" /></button>
    </div>
  </aside>;
}
