import { useI18n } from '../i18n/I18nContext';

export function WrenchFoundScreen({ onClose }: { onClose: () => void }) {
  const { language } = useI18n();
  const text = language === 'en'
    ? { title: 'Wrench found', damage: 'Damage: 2', cooldown: 'Attack cooldown: 1.5 seconds', repair: 'Repairs cost only 15 wood', switchWeapon: 'Use your weapon-switch control to equip it again.', close: 'Continue' }
    : language === 'kk'
      ? { title: 'Сомын кілті табылды', damage: 'Зақым: 2', cooldown: 'Соққы кідірісі: 1,5 секунд', repair: 'Жөндеу тек 15 ағаш тұрады', switchWeapon: 'Қайта жабдықтау үшін қаруды ауыстыру батырмасын бас.', close: 'Жалғастыру' }
      : { title: 'Найден гаечный ключ', damage: 'Урон: 2', cooldown: 'Перезарядка удара: 1,5 секунды', repair: 'Ремонт базы стоит только 15 дерева', switchWeapon: 'Чтобы снова его выбрать, используй кнопку смены оружия.', close: 'Продолжить' };
  return <aside className="wrench-found" role="dialog" aria-modal="true" aria-label={text.title}>
    <section className="wrench-found__card"><span className="wrench-found__icon" />
      <h2>{text.title}</h2><p>{text.damage}</p><p>{text.cooldown}</p><p>{text.repair}</p><p>{text.switchWeapon}</p>
      <button onClick={onClose}>{text.close}</button>
    </section>
  </aside>;
}
