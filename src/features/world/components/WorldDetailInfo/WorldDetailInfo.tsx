import type { World } from '@/shared/types';
import s from './WorldDetailInfo.module.css';

interface Props {
  world: World;
}

/**
 * Spec 2.4 — info-grid pod hero. Popis, tóny chips, kostky chips, systém,
 * playerCount/maxPlayers, owner username, „hledáme" callout.
 */
export function WorldDetailInfo({ world }: Props) {
  const hasDescription = !!world.description?.trim();
  const hasTones = (world.tones?.length ?? 0) > 0;
  const hasDice = (world.dice?.length ?? 0) > 0;
  const hasPlayersWanted = !!world.playersWanted?.trim();
  const playerCount = world.playerCount ?? 0;
  const capacity = world.maxPlayers;

  return (
    <div className={s.grid}>
      {hasDescription && (
        <section className={s.descBlock}>
          <h2 className={s.sectionTitle}>O světě</h2>
          <p className={s.description}>{world.description}</p>
        </section>
      )}

      <aside className={s.statsBlock}>
        <h2 className={s.sectionTitle}>Detaily</h2>
        <dl className={s.statsList}>
          {world.genre && (
            <>
              <dt>Žánr</dt>
              <dd>{world.genre}</dd>
            </>
          )}
          <dt>Systém</dt>
          <dd>{world.system}</dd>
          <dt>Hráči</dt>
          <dd>
            {playerCount}
            {capacity != null && ` / ${capacity}`}
          </dd>
          {world.owner?.username && (
            <>
              <dt>PJ</dt>
              <dd>@{world.owner.username}</dd>
            </>
          )}
        </dl>
      </aside>

      {hasTones && world.tones && (
        <section className={s.chipsBlock}>
          <h2 className={s.sectionTitle}>Tón a styl</h2>
          <div className={s.chips}>
            {world.tones.map((t) => (
              <span key={t} className={s.chip}>
                {t}
              </span>
            ))}
          </div>
        </section>
      )}

      {hasDice && world.dice && (
        <section className={s.chipsBlock}>
          <h2 className={s.sectionTitle}>Kostky a mechaniky</h2>
          <div className={s.chips}>
            {world.dice.map((d) => (
              <span key={d} className={s.chip}>
                {d}
              </span>
            ))}
          </div>
        </section>
      )}

      {hasPlayersWanted && (
        <section className={s.callout}>
          <h2 className={s.sectionTitle}>Hledáme</h2>
          <p className={s.calloutText}>{world.playersWanted}</p>
        </section>
      )}
    </div>
  );
}
