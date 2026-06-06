import { useParams } from 'react-router-dom';
import { Spinner } from '@/shared/ui';
import { useWorld } from '@/features/world/api/useWorlds';
import { useWorldStatus } from '@/features/world/api/useWorldStatus';
import { WorldDetailHero } from '@/features/world/components/WorldDetailHero';
import { WorldDetailInfo } from '@/features/world/components/WorldDetailInfo';
import { WorldAboutPanel } from '@/features/world/components/WorldAboutPanel';
import { JoinCTA } from '@/features/world/components/JoinCTA';
import { AccessRequestPending } from '@/features/world/components/AccessRequestPending';
import { WorldNotFound } from '@/features/world/components/WorldNotFound';
import { WorldToolboxPanel } from '@/features/world/help';
import { WorldDashboard } from './WorldDashboard';
import s from './WorldDashboardPage.module.css';

/**
 * Spec 2.4 — index route `/svet/:worldId`. Větví rendering podle
 * `useWorldStatus` (non-member / pending-access / member).
 *
 *  - `non-member`     → hero + info + JoinCTA
 *  - `pending-access` → hero + info + AccessRequestPending (banner + cancel)
 *  - `member`         → hero + WorldDashboard (3sloupcový) + WorldAboutPanel (5.4)
 *  - 404 / error      → WorldNotFound (BE 404 pro private bez přístupu)
 */
export default function WorldDashboardPage() {
  const { worldSlug = '' } = useParams<{ worldSlug: string }>();
  const { data: world, isLoading, isError } = useWorld(worldSlug);
  const { status, pendingAccessRequest, isLoading: statusLoading } =
    useWorldStatus(world?.id ?? '');

  if (isLoading || statusLoading) {
    return (
      <div className={s.loading}>
        <Spinner center />
      </div>
    );
  }

  if (isError || !world) {
    return <WorldNotFound />;
  }

  if (status === 'member') {
    return (
      <article className={s.page}>
        <WorldDetailHero world={world} />
        <WorldDashboard world={world} />
        <WorldToolboxPanel />
        <WorldAboutPanel world={world} />
      </article>
    );
  }

  return (
    <article className={s.page}>
      <WorldDetailHero world={world} />
      <div className={s.body}>
        <WorldDetailInfo world={world} />
        <aside className={s.aside}>
          {status === 'non-member' && <JoinCTA world={world} />}
          {status === 'pending-access' && pendingAccessRequest && (
            <AccessRequestPending
              worldId={world.id}
              requestedAt={pendingAccessRequest.requestedAt}
            />
          )}
        </aside>
      </div>
    </article>
  );
}
