import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { StartMenu } from './components/StartMenu';
import { supabase } from './lib/supabase';
import { GameScene } from './pages/GameScene';

export default function App() {
  const [session, setSession] = useState<Session | null>();
  const [guestNickname, setGuestNickname] = useState<string>();

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  if (session === undefined) return <main className="session-loading">Загрузка Forest Base…</main>;
  const savedNickname = session?.user.user_metadata.nickname;
  const googleName = session?.user.user_metadata.full_name ?? session?.user.user_metadata.name;
  const playerNickname = typeof savedNickname === 'string' && savedNickname.trim()
    ? savedNickname.trim()
    : typeof googleName === 'string' && googleName.trim() ? googleName.trim() : session?.user.email?.split('@')[0];
  return session || guestNickname
    ? <GameScene playerNickname={playerNickname ?? guestNickname ?? 'Гость'} />
    : <StartMenu onGuestLogin={() => setGuestNickname('Гость')} />;
}
