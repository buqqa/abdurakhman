interface Props { enabled: boolean }

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
  return <aside className="mobile-controls" aria-label="Мобильное управление">
    <div className="mobile-joystick">
      <DirectionButton code="KeyW" label="↑" enabled={enabled} /><DirectionButton code="KeyA" label="←" enabled={enabled} />
      <span className="mobile-joystick__center" /><DirectionButton code="KeyD" label="→" enabled={enabled} />
      <DirectionButton code="KeyS" label="↓" enabled={enabled} />
    </div>
    <div className="mobile-actions">
      <button className="mobile-inventory" disabled={!enabled} onClick={() => sendKey('KeyB', 'keydown')} aria-label="Открыть инвентарь">B</button>
      <button className="mobile-attack" disabled={!enabled} onPointerDown={(event) => { event.preventDefault(); attack(); }} aria-label="Удар">⚔</button>
    </div>
  </aside>;
}
