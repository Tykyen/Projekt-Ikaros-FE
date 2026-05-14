import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { isAuthenticatedAtom } from '@/shared/store/authStore';
import { useMyWorlds, usePublicWorlds } from '@/features/world/api/useWorlds';
import { WorldCard } from '../DashboardPage/components/WorldCard';
import {
  WorldsToolbar,
  type FilterValue,
  type SortValue,
} from './components/WorldsToolbar';
import type { World, WorldMembership } from '@/shared/types';
import s from './WorldsPage.module.css';

function parseFilter(value: string | null, fallback: FilterValue): FilterValue {
  return value === 'all' || value === 'public' || value === 'mine'
    ? value
    : fallback;
}
function parseSort(value: string | null, fallback: SortValue): SortValue {
  return value === 'new' || value === 'abc' || value === 'seats'
    ? value
    : fallback;
}

function applyFilter(
  worlds: World[],
  membershipMap: Map<string, WorldMembership>,
  filter: FilterValue,
): World[] {
  if (filter === 'all') return worlds;
  if (filter === 'public')
    return worlds.filter(
      (w) => w.accessMode === 'public' || w.accessMode === 'open',
    );
  if (filter === 'mine')
    return worlds.filter((w) => membershipMap.has(w.id));
  return worlds;
}

function applySort(worlds: World[], sort: SortValue): World[] {
  const arr = [...worlds];
  if (sort === 'new') {
    arr.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } else if (sort === 'abc') {
    arr.sort((a, b) => a.name.localeCompare(b.name, 'cs'));
  } else if (sort === 'seats') {
    arr.sort((a, b) => {
      const seatsA = a.maxPlayers != null ? a.maxPlayers - a.playerCount : -1;
      const seatsB = b.maxPlayers != null ? b.maxPlayers - b.playerCount : -1;
      return seatsB - seatsA;
    });
  }
  return arr;
}

export default function WorldsPage() {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const publicQuery = usePublicWorlds();
  const myQuery = useMyWorlds();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const filter = parseFilter(searchParams.get('filter'), 'all');
  const sort = parseSort(searchParams.get('sort'), 'new');

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const membershipMap = useMemo(() => {
    const map = new Map<string, WorldMembership>();
    myQuery.data?.forEach(({ world, membership }) =>
      map.set(world.id, membership),
    );
    return map;
  }, [myQuery.data]);

  const allWorlds = useMemo(() => {
    const map = new Map<string, World>();
    publicQuery.data?.forEach((w) => map.set(w.id, w));
    myQuery.data?.forEach(({ world }) => map.set(world.id, world));
    return Array.from(map.values());
  }, [publicQuery.data, myQuery.data]);

  const visibleWorlds = useMemo(() => {
    const filtered = applyFilter(allWorlds, membershipMap, filter);
    const q = search.trim().toLowerCase();
    const searched = q
      ? filtered.filter((w) => w.name.toLowerCase().includes(q))
      : filtered;
    return applySort(searched, sort);
  }, [allWorlds, membershipMap, filter, sort, search]);

  const isLoading = publicQuery.isPending || (isAuthenticated && myQuery.isPending);

  return (
    <div className={s.page}>
      <div>
        <h2 className={s.title}>Vesmíry</h2>
        <p className={s.subtitle}>
          Prozkoumej aktivní světy platformy. Klikni na svět pro detail
          {isAuthenticated ? '; do svých světů můžeš vstoupit přímo.' : '.'}
        </p>
      </div>

      <WorldsToolbar
        search={search}
        onSearchChange={(v) => setParam('q', v)}
        filter={filter}
        onFilterChange={(v) => setParam('filter', v === 'all' ? '' : v)}
        sort={sort}
        onSortChange={(v) => setParam('sort', v === 'new' ? '' : v)}
        isAuthenticated={isAuthenticated}
      />

      {isLoading && (
        <div className={s.skeleton} aria-label="Načítám světy">
          <div className={s.skeletonCard} />
          <div className={s.skeletonCard} />
          <div className={s.skeletonCard} />
        </div>
      )}

      {!isLoading && visibleWorlds.length === 0 && (
        <div className={s.empty}>
          <p className={s.emptyText}>
            {allWorlds.length === 0
              ? 'Zatím tu nejsou žádné aktivní světy.'
              : 'Žádné světy odpovídající filtru.'}
          </p>
        </div>
      )}

      {!isLoading && visibleWorlds.length > 0 && (
        <div className={s.grid}>
          {visibleWorlds.map((world) => (
            <WorldCard
              key={world.id}
              world={world}
              membership={membershipMap.get(world.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
