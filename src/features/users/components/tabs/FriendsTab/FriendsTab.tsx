import { Users } from 'lucide-react';
import s from './FriendsTab.module.css';

/**
 * Spec 1.4 — kostra tabu. Funkčnost staví 1.8 (friendships modul + queue
 * typ `friend_request` ve Zpracovat tabu). V 1.4 jen placeholder.
 */
export function FriendsTab() {
  return (
    <section className={s.empty} aria-label="Přátelé">
      <div className={s.icon} aria-hidden="true">
        <Users size={48} />
      </div>
      <h2 className={s.title}>Zatím nemáš přátele</h2>
      <p className={s.subtitle}>
        Jakmile někdo přijme tvou žádost, objeví se tady. Plnohodnotná funkčnost
        přátel přijde s krokem 1.8.
      </p>
    </section>
  );
}
