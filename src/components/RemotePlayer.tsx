import type { RemotePlayer as RemotePlayerState } from '../game/multiplayer';

export function RemotePlayer({ player }: { player: RemotePlayerState }) {
  return <div className={`player player--remote player--${player.weapon}`} style={{ transform: `translate(${player.x}px, ${player.y}px)` }}>
    <span className="player__nickname">{player.nickname}</span>
    <span className="player__sprite"><span className="player__hair" /><span className="player__head"><i /></span>
      <span className="player__arm player__arm--left" /><span className="player__body" />
      <span className="player__arm player__arm--right" /><span className="player__legs" />
      <span className={`player__weapon player__weapon--${player.weapon}`}><i /></span>
    </span>
  </div>;
}
