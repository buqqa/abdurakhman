import { Auth } from './Auth';

type StartMenuProps = {
  onGuestLogin: () => void;
};

export function StartMenu({ onGuestLogin }: StartMenuProps) {
  return (
    <main className="start-menu">
      <section className="start-menu__intro">
        <p>2D zombie survival</p><h1>Forest Base</h1>
        <h2>Переживи ночь. Защити крепость.</h2>
        <ul><li>Исследуй большой лес</li><li>Собирай припасы</li><li>Отбивайся от зомби</li></ul>
      </section>
      <Auth onGuestLogin={onGuestLogin} />
    </main>
  );
}
