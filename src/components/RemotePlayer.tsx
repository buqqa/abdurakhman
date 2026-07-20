import { memo, useEffect, useState } from 'react';
import type { RemotePlayer as RemotePlayerState } from '../game/multiplayer';

export const RemotePlayer = memo(function RemotePlayer({ player }: { player: RemotePlayerState }) {
  const [attacking, setAttacking] = useState(false);
  useEffect(() => {
    if (!player.attackNonce) return;
    setAttacking(true);
    const timer = window.setTimeout(() => setAttacking(false), 260);
    return () => window.clearTimeout(timer);
  }, [player.attackNonce]);
  return <div className={`player player--remote player--${player.weapon} ${player.facingRight ? 'player--mirrored' : ''} ${player.walking ? 'player--walking' : ''} ${attacking ? 'player--attacking' : ''} ${player.downed ? 'player--downed' : ''}`} style={{ transform: `translate(${player.x}px, ${player.y}px)` }}>
    <span className="player__nickname">{player.nickname}</span>
    <span className="player__sprite"><span className="player__hair" /><span className="player__head"><i /></span>
      <span className="player__arm player__arm--left" /><span className="player__body" />
      <span className="player__arm player__arm--right" /><span className="player__legs" />
      <span className={`player__weapon player__weapon--${player.weapon}`}><i /></span>
    </span>
  </div>;
});
