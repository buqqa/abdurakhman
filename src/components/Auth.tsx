import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { hasForbiddenWords } from '../lib/nicknameValidation';

type AuthProps = {
  onGuestLogin: () => void;
};

export function Auth({ onGuestLogin }: AuthProps) {
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
      const result = mode === 'signup'
        ? await supabase.auth.signUp({ email, password, options: { data: { nickname: nickname.trim() } } })
        : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) setMessage(result.error.message);
      else if (mode === 'signup' && !result.data.session) {
        setMessage('Аккаунт создан. Подтверди email через письмо и войди.');
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
        <button className={mode === 'signup' ? 'active' : ''} onClick={() => changeMode('signup')}>Регистрация</button>
        <button className={mode === 'signin' ? 'active' : ''} onClick={() => changeMode('signin')}>Вход</button>
      </div>
      <form onSubmit={handleSubmit} className="auth-form">
        {mode === 'signup' && <label>Никнейм<input type="text" placeholder="Имя над персонажем"
          value={nickname} onChange={(event) => setNickname(event.target.value)}
          minLength={2} maxLength={18} autoComplete="nickname" required /></label>}
        <label>Адрес почты<input type="email" placeholder="player@example.com" value={email}
          onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
        <label>Пароль<input type="password" placeholder="Минимум 6 символов" value={password}
          onChange={(event) => setPassword(event.target.value)} minLength={6}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required /></label>
        {mode === 'signup' && <label>Повтори пароль<input type="password" placeholder="Введи пароль ещё раз"
          value={passwordRepeat} onChange={(event) => setPasswordRepeat(event.target.value)}
          minLength={6} autoComplete="new-password" required /></label>}
        <button type="submit" disabled={busy}>
          {busy ? 'Подождите…' : mode === 'signup' ? 'Создать аккаунт' : 'Войти в игру'}
        </button>
      </form>
      <div className="auth-divider"><span>или</span></div>
      <button className="google-button" type="button" onClick={handleGoogleLogin} disabled={busy}>
        <span aria-hidden="true">G</span> Продолжить через Google
      </button>
      <button className="guest-button" type="button" onClick={onGuestLogin}>Войти как гость</button>
      {message && <p className="auth-message">{message}</p>}
    </section>
  );
}
