import { Search } from 'lucide-react';
import clsx from 'clsx';
import s from './WorldsToolbar.module.css';

export type FilterValue = 'all' | 'public' | 'mine';
export type SortValue = 'new' | 'abc' | 'seats';

const FILTERS: { value: FilterValue; label: string; loggedInOnly?: boolean }[] = [
  { value: 'all', label: 'Vše' },
  { value: 'public', label: 'Veřejné' },
  { value: 'mine', label: 'Mé světy', loggedInOnly: true },
];

const SORTS: { value: SortValue; label: string }[] = [
  { value: 'new', label: 'Nejnovější' },
  { value: 'abc', label: 'Abecedně' },
  { value: 'seats', label: 'Volná místa' },
];

interface WorldsToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  filter: FilterValue;
  onFilterChange: (v: FilterValue) => void;
  sort: SortValue;
  onSortChange: (v: SortValue) => void;
  isAuthenticated: boolean;
}

export function WorldsToolbar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  sort,
  onSortChange,
  isAuthenticated,
}: WorldsToolbarProps) {
  return (
    <div className={s.toolbar}>
      <div className={s.searchWrap}>
        <Search size={16} className={s.searchIcon} aria-hidden="true" />
        <input
          type="search"
          className={s.search}
          placeholder="Najít svět…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Hledat svět podle názvu"
        />
      </div>

      <div className={s.chipGroup} role="group" aria-label="Filtr přístupu">
        {FILTERS.filter((f) => !f.loggedInOnly || isAuthenticated).map((f) => (
          <button
            key={f.value}
            type="button"
            className={clsx(s.chip, filter === f.value && s.chipActive)}
            onClick={() => onFilterChange(f.value)}
            aria-pressed={filter === f.value}
          >
            {f.label}
          </button>
        ))}
      </div>

      <label className={s.sortWrap}>
        <span>Řadit:</span>
        <select
          className={s.sortSelect}
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortValue)}
          aria-label="Řazení světů"
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
