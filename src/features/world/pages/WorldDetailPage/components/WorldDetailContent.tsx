import type { World, WorldMembership } from '@/shared/types';
import { WorldDetailDescription } from './WorldDetailDescription';
import { WorldDetailMeta } from './WorldDetailMeta';
import { WorldDetailJoinCTA } from './WorldDetailJoinCTA';
import s from './WorldDetailContent.module.css';

interface Props {
  world: World;
  myMembership: WorldMembership | null;
  isAuthenticated: boolean;
}

/**
 * Spec 2.4 — 2-sloupcová sekce: popis vlevo (drop cap na desktopu),
 * meta sidebar vpravo (sticky), pod sidebarem Join CTA.
 */
export function WorldDetailContent({
  world,
  myMembership,
  isAuthenticated,
}: Props) {
  return (
    <div className={s.content}>
      <article className={s.descriptionWrap}>
        <WorldDetailDescription description={world.description} />
        {world.playersWanted ? (
          <aside className={s.playersWanted} aria-label="Koho PJ hledá">
            <p className={s.playersWantedLabel}>Koho PJ hledá</p>
            <p className={s.playersWantedText}>{world.playersWanted}</p>
          </aside>
        ) : null}
      </article>

      <aside className={s.sidebar} aria-label="Detaily světa">
        <WorldDetailMeta world={world} />
        <WorldDetailJoinCTA
          world={world}
          myMembership={myMembership}
          isAuthenticated={isAuthenticated}
        />
      </aside>
    </div>
  );
}
