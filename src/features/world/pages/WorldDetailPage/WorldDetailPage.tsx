import { useParams } from 'react-router-dom';
import { useWorld, useMyWorlds } from '@/features/world/api/useWorlds';
import { WorldRole } from '@/shared/types';
import { useAtomValue } from 'jotai';
import { accessTokenAtom } from '@/shared/store/authStore';
import { useMemo } from 'react';
import { WorldDetailTopBar } from './components/WorldDetailTopBar';
import { WorldDetailMasthead } from './components/WorldDetailMasthead';
import { WorldDetailContent } from './components/WorldDetailContent';
import { WorldDetailOwner } from './components/WorldDetailOwner';
import { WorldDetailSkeleton } from './components/WorldDetailSkeleton';
import { WorldDetailNotFound } from './components/WorldDetailNotFound';
import s from './WorldDetailPage.module.css';

/**
 * Spec 2.4 — public Detail světa, route `/svet/:worldId/info`.
 * Vlastní lehký shell (žádný WorldLayout). Anon/Zadatel/Hrac/Admin sem mohou
 * volně. Member uvidí CTA „Vstoupit do hry" místo „Vstoupit/Požádat o vstup".
 */
export default function WorldDetailPage() {
  const { worldId = '' } = useParams<{ worldId: string }>();
  const token = useAtomValue(accessTokenAtom);
  const { data: world, isLoading, isError } = useWorld(worldId);
  const { data: myWorlds } = useMyWorlds();

  const myMembership = useMemo(
    () => myWorlds?.find((m) => m.world.id === worldId)?.membership,
    [myWorlds, worldId],
  );

  if (isLoading) {
    return (
      <div className={s.page}>
        <WorldDetailTopBar worldId={worldId} />
        <WorldDetailSkeleton />
      </div>
    );
  }

  if (isError || !world) {
    return (
      <div className={s.page}>
        <WorldDetailTopBar worldId={worldId} />
        <WorldDetailNotFound />
      </div>
    );
  }

  return (
    <div className={s.page}>
      <WorldDetailTopBar worldId={worldId} />
      <WorldDetailMasthead world={world} />
      <WorldDetailContent
        world={world}
        myMembership={myMembership ?? null}
        isAuthenticated={!!token}
      />
      <WorldDetailOwner owner={world.owner} />
    </div>
  );
}

export { WorldRole };
