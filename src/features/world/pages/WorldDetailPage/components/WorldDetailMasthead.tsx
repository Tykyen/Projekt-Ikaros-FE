import type { World } from '@/shared/types';
import s from './WorldDetailMasthead.module.css';

const ACCESS_LABELS: Record<string, string> = {
  public: 'Veřejný svět',
  open: 'Otevřený svět',
  private: 'Soukromý svět',
  closed: 'Uzavřený svět',
};

interface Props {
  world: World;
}

/**
 * Spec 2.4 — masthead (top hero). Indicia stripe + obrovský název +
 * single-line meta. Almanach kompozice s ragged-right H1.
 */
export function WorldDetailMasthead({ world }: Props) {
  const accessLabel =
    ACCESS_LABELS[world.accessMode] ?? ACCESS_LABELS.private;
  const indicia = [
    world.genre?.toUpperCase(),
    new Date(world.createdAt).toLocaleDateString('cs-CZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <section className={s.masthead} aria-labelledby="world-title">
      <p className={s.indicia}>{indicia || 'IKAROS'}</p>
      <h1 className={s.title} id="world-title">
        {world.name}
      </h1>
      <p className={s.metaLine}>
        {world.owner ? (
          <>
            <span className={s.metaItem}>Vede {world.owner.username}</span>
            <span className={s.dot} aria-hidden>
              ·
            </span>
          </>
        ) : null}
        <span className={s.metaItem}>
          {world.playerCount}
          {world.maxPlayers ? ` / ${world.maxPlayers}` : ''} hráč
          {world.playerCount === 1 ? '' : 'ů'}
        </span>
        <span className={s.dot} aria-hidden>
          ·
        </span>
        <span className={s.metaItem}>{accessLabel}</span>
      </p>
    </section>
  );
}
