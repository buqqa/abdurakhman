import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { StartMenu } from './components/StartMenu';
import { supabase } from './lib/supabase';
import { GameScene } from './pages/GameScene';
import { useI18n } from './i18n/I18nContext';

export default function App() {
  const { t } = useI18n();
  const [session, setSession] = useState<Session | null>();
  const [guestNickname, setGuestNickname] = useState<string>();

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  if (session === undefined) return <main className="session-loading">{t('loading')}</main>;
  const savedNickname = session?.user.user_metadata.nickname;
  const googleName = session?.user.user_metadata.full_name ?? session?.user.user_metadata.name;
  const playerNickname = typeof savedNickname === 'string' && savedNickname.trim()
    ? savedNickname.trim()
    : typeof googleName === 'string' && googleName.trim() ? googleName.trim() : session?.user.email?.split('@')[0];
  return session || guestNickname
    ? <GameScene playerNickname={playerNickname ?? guestNickname ?? t('guestName')} isRegistered={Boolean(session)} />
    : <StartMenu onGuestLogin={() => setGuestNickname(t('guestName'))} />;
}
