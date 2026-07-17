import { useI18n } from '../i18n/I18nContext';

interface Props { onSolo: () => void; onFriend: () => void }

export function PlayModeScreen({ onSolo, onFriend }: Props) {
  const { language } = useI18n();
  const text = language === 'en'
    ? { title: 'Choose game mode', solo: 'Play solo', soloInfo: 'Survive and defend the base alone', friend: 'Play with a friend', friendInfo: 'Create a party or join with a code' }
    : language === 'kk'
      ? { title: 'Ойын режимін таңда', solo: 'Жалғыз ойнау', soloInfo: 'Жалғыз аман қалып, қамалды қорға', friend: 'Досыңмен ойнау', friendInfo: 'Топ құр немесе кодпен қосыл' }
      : { title: 'Выбери режим игры', solo: 'Играть одному', soloInfo: 'Выживай и защищай базу в одиночку', friend: 'Играть с другом', friendInfo: 'Создай группу или присоединись по коду' };
  return <main className="setup-screen">
    <p>Forest Base</p><h1>{text.title}</h1>
    <div className="setup-grid">
      <button className="setup-card" onClick={onSolo}><span className="mode-people mode-people--one"><i /></span><strong>{text.solo}</strong><small>{text.soloInfo}</small></button>
      <button className="setup-card" onClick={onFriend}><span className="mode-people mode-people--two"><i /><i /></span><strong>{text.friend}</strong><small>{text.friendInfo}</small></button>
    </div>
  </main>;
}
