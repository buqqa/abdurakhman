import { createPortal } from 'react-dom';

interface Props { code: string; players: number; maxPlayers: number }

export function PartyGameBadge({ code, players, maxPlayers }: Props) {
  return createPortal(<aside className="party-game-badge" aria-label="Сетевая комната">
    <span>Код комнаты</span><strong>{code}</strong><small>{players}/{maxPlayers} игроков</small>
  </aside>, document.body);
}
