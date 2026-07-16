import { useI18n } from '../i18n/I18nContext';

export type DeviceMode = 'mobile' | 'desktop';

interface Props { onSelect: (device: DeviceMode) => void; onBack: () => void }

export function DeviceScreen({ onSelect, onBack }: Props) {
  const { language } = useI18n();
  const text = language === 'en'
    ? { title: 'Choose your device', mobileInfo: 'On-screen joystick and action buttons', desktopInfo: 'Keyboard and mouse controls', back: 'Back' }
    : language === 'kk'
      ? { title: 'Құрылғыны таңда', mobileInfo: 'Экрандағы джойстик пен әрекет батырмалары', desktopInfo: 'Пернетақта мен тінтуір арқылы басқару', back: 'Артқа' }
      : { title: 'Выбери устройство', mobileInfo: 'Экранный джойстик и кнопки действий', desktopInfo: 'Управление клавиатурой и мышью', back: 'Назад' };
  return <main className="device-screen">
    <p>Forest Base</p><h1>{text.title}</h1>
    <div className="device-grid">
      <button className="device-card" onClick={() => onSelect('mobile')}><span className="device-phone"><i /><b /></span><strong>PHONE / TABLET</strong><small>{text.mobileInfo}</small></button>
      <button className="device-card" onClick={() => onSelect('desktop')}><span className="device-monitor"><i /><b /></span><strong>COMPUTER / LAPTOP</strong><small>{text.desktopInfo}</small></button>
    </div>
    <button className="device-back" onClick={onBack}>{text.back}</button>
  </main>;
}
