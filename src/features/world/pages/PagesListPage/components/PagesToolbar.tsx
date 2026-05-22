import { Search } from 'lucide-react';
import clsx from 'clsx';
import { ALL_PAGE_TYPES, type PageType } from '../../api/pages.types';
import s from './PagesToolbar.module.css';

export type TypeFilter = PageType | 'all';
export type SortValue = 'order' | 'abc' | 'type';

const SORTS: { value: SortValue; label: string }[] = [
  { value: 'order', label: 'Pořadí' },
  { value: 'abc', label: 'Abecedně' },
  { value: 'type', label: 'Dle typu' },
];

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  typeFilter: TypeFilter;
  onTypeFilterChange: (v: TypeFilter) => void;
  sort: SortValue;
  onSortChange: (v: SortValue) => void;
}

/**
 * 7.3 — Toolbar indexu stránek: fulltext hledání, chips filtru typu,
 * select řazení. Vizuálně konzistentní s `WorldsToolbar`.
 */
export function PagesToolbar({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  sort,
  onSortChange,
}: Props) {
  return (
    <div className={s.toolbar}>
      <div className={s.searchWrap}>
        <Search size={16} className={s.searchIcon} aria-hidden="true" />
        <input
          type="search"
          className={s.search}
          placeholder="Najít stránku…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Hledat stránku podle názvu"
        />
      </div>

      <div className={s.chipGroup} role="group" aria-label="Filtr typu stránky">
        <button
          type="button"
          className={clsx(s.chip, typeFilter === 'all' && s.chipActive)}
          onClick={() => onTypeFilterChange('all')}
          aria-pressed={typeFilter === 'all'}
        >
          Vše
        </button>
        {ALL_PAGE_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            className={clsx(s.chip, typeFilter === t && s.chipActive)}
            onClick={() => onTypeFilterChange(t)}
            aria-pressed={typeFilter === t}
          >
            {t}
          </button>
        ))}
      </div>

      <label className={s.sortWrap}>
        <span>Řadit:</span>
        <select
          className={s.sortSelect}
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortValue)}
          aria-label="Řazení stránek"
        >
          {SORTS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
