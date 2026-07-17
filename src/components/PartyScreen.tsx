import { useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';

export interface PartyGameSettings { nights: number; difficulty: string; maxPlayers: number; code: string }
interface Props { onBack: () => void; onReady: (settings: PartyGameSettings) => void }
type View = 'choose' | 'create' | 'join';
const difficulties = [{ name: 'PEACEFUL', nights: 15, code: 'P' }, { name: 'SURVIVOR', nights: 25, code: 'S' }, { name: 'HARDCORE', nights: 50, code: 'H' }];
const suffix = () => Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, 'X');

export function PartyScreen({ onBack, onReady }: Props) {
  const { language } = useI18n();
  const [view, setView] = useState<View>('choose');
  const [difficulty, setDifficulty] = useState(difficulties[1]);
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const randomPart = useMemo(suffix, []);
  const code = `${difficulty.code}${maxPlayers}${randomPart}`;
  const text = language === 'en'
    ? { title: 'Play with a friend', create: 'Create party', join: 'Join party', hostInfo: 'Choose party settings and share the code', joinInfo: 'Enter the code from the party creator', difficulty: 'Difficulty', players: 'Players', code: 'Party code', continue: 'Continue', input: 'Enter 6-character code', invalid: 'Check the party code', waiting: 'The creator chooses difficulty and player count', back: 'Back' }
    : language === 'kk'
      ? { title: 'Досыңмен ойнау', create: 'Топ құру', join: 'Топқа қосылу', hostInfo: 'Топ баптауларын таңдап, кодты досыңа жібер', joinInfo: 'Топ иесі берген кодты енгіз', difficulty: 'Қиындық', players: 'Ойыншылар', code: 'Топ коды', continue: 'Жалғастыру', input: '6 таңбалы кодты енгіз', invalid: 'Топ кодын тексер', waiting: 'Қиындық пен ойыншы санын топ иесі таңдайды', back: 'Артқа' }
      : { title: 'Игра с другом', create: 'Создать группу', join: 'Присоединиться к группе', hostInfo: 'Выбери настройки и отправь код другу', joinInfo: 'Введи код, который дал создатель группы', difficulty: 'Сложность', players: 'Игроков', code: 'Код группы', continue: 'Продолжить', input: 'Введи код из 6 символов', invalid: 'Проверь код группы', waiting: 'Сложность и число игроков выбирает создатель', back: 'Назад' };
  const goBack = () => view === 'choose' ? onBack() : setView('choose');
  const join = () => {
    const normalized = joinCode.trim().toUpperCase();
    const selected = difficulties.find((item) => item.code === normalized[0]);
    const players = Number(normalized[1]);
    if (!selected || normalized.length !== 6 || players < 2 || players > 4) return setError(text.invalid);
    onReady({ nights: selected.nights, difficulty: selected.name, maxPlayers: players, code: normalized });
  };
  if (view === 'choose') return <main className="setup-screen"><p>Forest Base</p><h1>{text.title}</h1><div className="setup-grid">
    <button className="setup-card" onClick={() => setView('create')}><strong>{text.create}</strong><small>{text.hostInfo}</small></button>
    <button className="setup-card" onClick={() => setView('join')}><strong>{text.join}</strong><small>{text.joinInfo}</small></button>
    </div><button className="device-back" onClick={goBack}>{text.back}</button></main>;
  return <main className="party-screen"><p>Forest Base</p><h1>{view === 'create' ? text.create : text.join}</h1>
    {view === 'create' ? <>
      <label>{text.difficulty}<span className="party-options">{difficulties.map((item) => <button className={difficulty.name === item.name ? 'active' : ''} onClick={() => setDifficulty(item)} key={item.name}>{item.name}</button>)}</span></label>
      <label>{text.players}<span className="party-options">{[2, 3, 4].map((count) => <button className={maxPlayers === count ? 'active' : ''} onClick={() => setMaxPlayers(count)} key={count}>{count}</button>)}</span></label>
      <div className="party-code"><small>{text.code}</small><strong>{code}</strong></div>
      <button onClick={() => onReady({ nights: difficulty.nights, difficulty: difficulty.name, maxPlayers, code })}>{text.continue}</button>
    </> : <><p className="party-note">{text.waiting}</p><input value={joinCode} maxLength={6} placeholder={text.input} onChange={(event) => { setJoinCode(event.target.value.toUpperCase()); setError(''); }} />{error && <small className="party-error">{error}</small>}<button onClick={join}>{text.join}</button></>}
    <button className="device-back" onClick={goBack}>{text.back}</button>
  </main>;
}
