import type { PublicOwnerSummary } from '@/shared/types';
import s from './WorldDetailOwner.module.css';

interface Props {
  owner?: PublicOwnerSummary;
}

/**
 * Spec 2.4 — owner sekce na konci stránky. Profil link je v MVP plain text
 * (route `/u/:username` přijde s 1.1+).
 */
export function WorldDetailOwner({ owner }: Props) {
  if (!owner) {
    return (
      <section className={s.section} aria-label="Vlastník světa">
        <p className={s.label}>Vlastník</p>
        <p className={s.unknown}>Vlastník neznámý.</p>
      </section>
    );
  }

  return (
    <section className={s.section} aria-label="Vlastník světa">
      <p className={s.label}>Vlastník</p>
      <div className={s.card}>
        <Avatar owner={owner} />
        <div className={s.info}>
          <p className={s.name}>{owner.username}</p>
          <p className={s.role}>PJ tohoto světa</p>
        </div>
      </div>
    </section>
  );
}

function Avatar({ owner }: { owner: PublicOwnerSummary }) {
  if (owner.avatarUrl) {
    return (
      <img
        src={owner.avatarUrl}
        alt={`Avatar uživatele ${owner.username}`}
        className={s.avatar}
      />
    );
  }
  return (
    <div className={s.avatarFallback} aria-hidden>
      {owner.username.slice(0, 2).toUpperCase()}
    </div>
  );
}
