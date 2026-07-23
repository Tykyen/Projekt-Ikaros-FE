import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { currentUserAtom } from '@/shared/store/authStore';
import { onboardingStore } from '@/shared/vypravec/state/onboardingStore';
import { aktivniCesta } from '@/shared/vypravec/engine/journeyEngine';
import { vypravecReportEmpty } from '@/shared/vypravec/registry/emptyStates';
import { useParams } from 'react-router-dom';
import { Spinner, Breadcrumbs } from '@/shared/ui';
import { Seo, metaDescription, JsonLd, worldJsonLd, breadcrumbJsonLd } from '@/shared/seo';
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
  const currentUser = useAtomValue(currentUserAtom);

  // Vypravěč (07 §6): čerstvý svět vlastníka BEZ rozjeté cesty (dialog
  // přeskočil) → jednorázová rada prvního tahu. Veterán (backfill) ne.
  useEffect(() => {
    if (status !== 'member' || !world) return;
    if (world.ownerId !== currentUser?.id) return;
    const s = onboardingStore.getSnapshot();
    if (s.backfilled || aktivniCesta()) return;
    vypravecReportEmpty('svet-dashboard-cerstvy', {
      to: `/svet/${worldSlug}/stranky`,
    });
  }, [status, world, currentUser?.id, worldSlug]);

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

  // 15B.2 — indexovat jen veřejné světy; private/closed dostane noindex.
  const indexable = world.accessMode === 'public' || world.accessMode === 'open';
  // 15B.3 — drobečky sdílí Breadcrumbs i BreadcrumbList JSON-LD (jeden zdroj).
  const crumbs = [
    { label: 'Domů', href: '/' },
    { label: 'Světy', href: '/ikaros/vesmiry' },
    { label: world.name },
  ];
  const origin = window.location.origin;
  const seo = (
    <Seo
      title={world.name}
      description={
        metaDescription(world.description) ??
        `Svět ${world.name} na platformě Ikaros.`
      }
      image={world.imageUrl}
      noindex={!indexable}
    />
  );

  if (status === 'member') {
    return (
      <article className={s.page}>
        {seo}
        <WorldDetailHero world={world} />
        <WorldDashboard world={world} />
        <WorldToolboxPanel />
        <WorldAboutPanel world={world} />
      </article>
    );
  }

  return (
    <article className={s.page}>
      {seo}
      {indexable && <JsonLd data={worldJsonLd(world, origin)} />}
      {indexable && <JsonLd data={breadcrumbJsonLd(crumbs, origin)} />}
      <Breadcrumbs items={crumbs} />
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
