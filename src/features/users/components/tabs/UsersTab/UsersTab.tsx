import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { Input } from '@/shared/ui';
import { UserRole, type PublicUsersSort } from '@/shared/types';
import { currentUserAtom } from '@/shared/store/authStore';
import { useAdminUsers } from '@/features/admin/users/api/useAdminUsers';
import { UsersTable } from '@/features/admin/users/components/UsersTab/UsersTable';
import { usePublicUsers } from '../../../api/usePublicUsers';
import { ViewToggle, type UsersTabView } from './ViewToggle';
import { CardsGrid } from './CardsGrid';
import s from './UsersTab.module.css';

const PAGE_LIMIT_CARDS = 24;
const PAGE_LIMIT_TABLE = 20;

const ALLOWED_VIEWS: UsersTabView[] = ['cards', 'table'];
const ALLOWED_SORTS: PublicUsersSort[] = ['new', 'abc'];

function readView(params: URLSearchParams): UsersTabView {
  const raw = params.get('view');
  return ALLOWED_VIEWS.includes(raw as UsersTabView)
    ? (raw as UsersTabView)
    : 'cards';
}

function readSort(params: URLSearchParams): PublicUsersSort {
  const raw = params.get('sort');
  return ALLOWED_SORTS.includes(raw as PublicUsersSort)
    ? (raw as PublicUsersSort)
    : 'new';
}

function readPage(params: URLSearchParams): number {
  const raw = Number(params.get('page'));
  return Number.isFinite(raw) && raw >= 1 ? raw : 1;
}

/**
 * Spec 1.4 — Admin/Superadmin tab. View-toggle Karty / Tabulka sdílí
 * search + sort state přes URL params. Karty volá `GET /api/users` (1.4),
 * Tabulka reuse `useAdminUsers` z 1.3b (`GET /api/admin/users`).
 */
export function UsersTab() {
  const me = useAtomValue(currentUserAtom);
  const isAdmin =
    me?.role === UserRole.Superadmin || me?.role === UserRole.Admin;

  const [params, setParams] = useSearchParams();
  // Non-admin force-fallback na 'cards' — admin-only features (tabulka,
  // includeDeleted) silently ignored z URL.
  const view: UsersTabView = isAdmin ? readView(params) : 'cards';
  const sort = readSort(params);
  const page = readPage(params);
  const search = params.get('search') ?? '';
  const includeDeleted = isAdmin && params.get('includeDeleted') === '1';

  const [searchInput, setSearchInput] = useState(search);

  // Debounce 300ms — synchronizace s URL
  useEffect(() => {
    if (searchInput === search) return;
    const id = setTimeout(() => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (searchInput) next.set('search', searchInput);
          else next.delete('search');
          next.set('page', '1');
          return next;
        },
        { replace: true },
      );
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // Karty mód — public users endpoint
  const cardsQuery = usePublicUsers(
    {
      page,
      limit: PAGE_LIMIT_CARDS,
      search: search || undefined,
      sort,
      includeDeleted,
    },
    view === 'cards',
  );

  // Tabulka mód — admin users endpoint (reuse 1.3b). Volat jen pro admin
  // ve view 'table' (non-admin nemá ten endpoint povolený).
  const tableQuery = useAdminUsers(
    {
      page,
      limit: PAGE_LIMIT_TABLE,
      username: search || undefined,
    },
    isAdmin && view === 'table',
  );

  const total =
    view === 'cards' ? (cardsQuery.data?.total ?? 0) : (tableQuery.data?.total ?? 0);
  const limit = view === 'cards' ? PAGE_LIMIT_CARDS : PAGE_LIMIT_TABLE;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const updateParam = (key: string, value: string | null) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === null) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );
  };

  const setView = (next: UsersTabView) => {
    setParams(
      (prev) => {
        const out = new URLSearchParams(prev);
        out.set('view', next);
        out.set('page', '1');
        return out;
      },
      { replace: true },
    );
  };

  const setSort = (next: PublicUsersSort) => {
    setParams(
      (prev) => {
        const out = new URLSearchParams(prev);
        out.set('sort', next);
        out.set('page', '1');
        return out;
      },
      { replace: true },
    );
  };

  const setPage = (next: number) => updateParam('page', String(next));

  const toggleIncludeDeleted = (checked: boolean) =>
    updateParam('includeDeleted', checked ? '1' : null);

  const headerCount = useMemo(() => {
    if (view === 'cards' && cardsQuery.data) {
      return cardsQuery.data.total;
    }
    if (view === 'table' && tableQuery.data) {
      return tableQuery.data.total;
    }
    return null;
  }, [view, cardsQuery.data, tableQuery.data]);

  return (
    <section className={s.tab} aria-label="Uživatelé">
      <div className={s.toolbar}>
        {isAdmin && <ViewToggle value={view} onChange={setView} />}
        <Input
          className={s.searchInput}
          type="search"
          placeholder="Hledat podle přezdívky nebo jména…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Hledat uživatele"
        />
        <select
          className={s.sortSelect}
          value={sort}
          onChange={(e) => setSort(e.target.value as PublicUsersSort)}
          aria-label="Řadit podle"
        >
          <option value="new">Nejnovější</option>
          <option value="abc">Abecedně</option>
        </select>
        {isAdmin && (
          <label className={s.includeDeleted}>
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => toggleIncludeDeleted(e.target.checked)}
            />
            Zobrazit smazané
          </label>
        )}
      </div>

      {view === 'cards' ? (
        <CardsGrid
          items={cardsQuery.data?.items ?? []}
          isLoading={cardsQuery.isLoading}
          isError={cardsQuery.isError}
        />
      ) : (
        <UsersTable
          items={tableQuery.data?.items ?? []}
          total={tableQuery.data?.total ?? 0}
          page={page}
          limit={PAGE_LIMIT_TABLE}
          isLoading={tableQuery.isLoading}
          onPageChange={setPage}
        />
      )}

      {view === 'cards' && total > 0 && (
        <div className={s.pagination}>
          <button
            type="button"
            className={s.paginationBtn}
            disabled={page <= 1}
            onClick={() => setPage(Math.max(1, page - 1))}
          >
            Předchozí
          </button>
          <span className={s.paginationInfo}>
            Stránka {page} z {totalPages}
            {headerCount !== null && ` · celkem ${headerCount} uživatelů`}
          </span>
          <button
            type="button"
            className={s.paginationBtn}
            disabled={page >= totalPages}
            onClick={() => setPage(Math.min(totalPages, page + 1))}
          >
            Další
          </button>
        </div>
      )}
    </section>
  );
}
