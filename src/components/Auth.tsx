import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { hasForbiddenWords } from '../lib/nicknameValidation';
import { useI18n } from '../i18n/I18nContext';

type AuthProps = {
  onGuestLogin: () => void;
};

export function Auth({ onGuestLogin }: AuthProps) {
  const { t, language } = useI18n();
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    if (mode === 'signup' && hasForbiddenWords(nickname)) {
      setMessage('Этот никнейм содержит запрещённые слова. Выбери другой.');
      return;
    }
    if (mode === 'signup' && password !== passwordRepeat) {
      setMessage('Пароли не совпадают. Попробуй ввести их ещё раз.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signup') {
        const result = await supabase.auth.signUp({ email, password, options: { data: { nickname: nickname.trim() } } });
        if (result.error) setMessage(result.error.message);
        else {
          if (result.data.session) await supabase.auth.signOut({ scope: 'local' });
          setMode('signin');
          setPassword('');
          setPasswordRepeat('');
          setMessage(language === 'en' ? 'Account created. Now sign in with your email and password.'
            : language === 'kk' ? 'Аккаунт ашылды. Енді пошта мен құпиясөз арқылы кір.'
              : 'Аккаунт создан. Теперь войди с помощью почты и пароля.');
        }
      } else {
        const result = await supabase.auth.signInWithPassword({ email, password });
        if (result.error) setMessage(result.error.message);
      }
    } catch {
      setMessage('Не получилось связаться с сервером. Попробуй ещё раз.');
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleLogin() {
    setBusy(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) setMessage(error.message);
    } catch {
      setMessage('Не удалось открыть вход через Google. Попробуй ещё раз.');
    } finally {
      setBusy(false);
    }
  }

  function changeMode(nextMode: 'signin' | 'signup') {
    setMode(nextMode);
    setMessage('');
    setPasswordRepeat('');
  }

  return (
    <section className="auth-card">
      <div className="auth-tabs">
        <button className={mode === 'signup' ? 'active' : ''} onClick={() => changeMode('signup')}>{t('signup')}</button>
        <button className={mode === 'signin' ? 'active' : ''} onClick={() => changeMode('signin')}>{t('signin')}</button>
      </div>
      <form onSubmit={handleSubmit} className="auth-form">
        {mode === 'signup' && <label>{t('nickname')}<input type="text" placeholder={t('nicknameHint')}
          value={nickname} onChange={(event) => setNickname(event.target.value)}
          minLength={2} maxLength={18} autoComplete="nickname" required /></label>}
        <label>{t('email')}<input type="email" placeholder="player@example.com" value={email}
          onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
        <label>{t('password')}<input type="password" placeholder={t('passwordHint')} value={password}
          onChange={(event) => setPassword(event.target.value)} minLength={6}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required /></label>
        {mode === 'signup' && <label>{t('repeatPassword')}<input type="password" placeholder={t('repeatHint')}
          value={passwordRepeat} onChange={(event) => setPasswordRepeat(event.target.value)}
          minLength={6} autoComplete="new-password" required /></label>}
        <button type="submit" disabled={busy}>
          {busy ? t('wait') : mode === 'signup' ? t('create') : t('enter')}
        </button>
      </form>
      <div className="auth-divider"><span>{t('or')}</span></div>
      <button className="google-button" type="button" onClick={handleGoogleLogin} disabled={busy}>
        <span aria-hidden="true">G</span> {t('google')}
      </button>
      <button className="guest-button" type="button" onClick={onGuestLogin}>{t('guest')}</button>
      {message && <p className="auth-message">{message}</p>}
    </section>
  );
}
