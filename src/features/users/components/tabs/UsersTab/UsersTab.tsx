import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input } from '@/shared/ui';
import { type PublicUsersSort } from '@/shared/types';
import { usePublicUsers } from '../../../api/usePublicUsers';
import { CardsGrid } from './CardsGrid';
import s from './UsersTab.module.css';

const PAGE_LIMIT_CARDS = 24;
const ALLOWED_SORTS: PublicUsersSort[] = ['new', 'abc'];

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
 * 12.1 — komunitní adresář uživatelů (veřejné karty). Admin tabulka /
 * bulk / ban byly přesunuty pod `/admin` (UsersAdminTab); tento tab je
 * teď čistě komunitní (procházení + žádost o přátelství). Search + sort
 * sdílí stav přes URL params.
 */
export function UsersTab() {
  const [params, setParams] = useSearchParams();
  const sort = readSort(params);
  const page = readPage(params);
  const search = params.get('search') ?? '';

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

  const cardsQuery = usePublicUsers({
    page,
    limit: PAGE_LIMIT_CARDS,
    search: search || undefined,
    sort,
    includeDeleted: false,
  });

  const total = cardsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT_CARDS));

  const setParam = (key: string, value: string | null) => {
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

  const setPage = (next: number) => setParam('page', String(next));

  const headerCount = useMemo(
    () => cardsQuery.data?.total ?? null,
    [cardsQuery.data],
  );

  return (
    <section className={s.tab} aria-label="Uživatelé">
      <div className={s.toolbar}>
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
      </div>

      <CardsGrid
        items={cardsQuery.data?.items ?? []}
        isLoading={cardsQuery.isLoading}
        isError={cardsQuery.isError}
      />

      {total > 0 && (
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
