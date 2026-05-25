import { Calendar, Plus, Search } from 'lucide-react';
import { Button, Input } from '@/shared/ui';
import type { TimelineFilters, TimelineSort } from './api/types';
import s from './TimelineToolbar.module.css';

interface Props {
  filters: TimelineFilters;
  onFiltersChange: (next: TimelineFilters) => void;
  canWrite: boolean;
  onAddClick: () => void;
  /** Mobile-only — toggle YearScrubber drawer. */
  onScrubberToggle: () => void;
}

const SORT_LABELS: Record<TimelineSort, string> = {
  desc: 'Nejnovější nahoře',
  asc: 'Nejstarší nahoře',
};

/**
 * 9.3 — toolbar: rok od/do + search + sort + „+ Nová" (PJ+) + scrubber toggle (mobil).
 */
export function TimelineToolbar({
  filters,
  onFiltersChange,
  canWrite,
  onAddClick,
  onScrubberToggle,
}: Props) {
  const sort: TimelineSort = filters.sort ?? 'desc';

  function patch(next: Partial<TimelineFilters>) {
    onFiltersChange({ ...filters, ...next });
  }

  function parseYear(raw: string): number | undefined {
    if (raw.trim() === '' || raw.trim() === '-') return undefined;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : undefined;
  }

  return (
    <div className={s.toolbar}>
      <div className={s.group}>
        <span className={s.label}>Rok od</span>
        <Input
          type="number"
          className={s.yearInput}
          value={filters.fromYear ?? ''}
          onChange={(e) => patch({ fromYear: parseYear(e.target.value) })}
          placeholder="−10000"
        />
        <span className={s.label}>do</span>
        <Input
          type="number"
          className={s.yearInput}
          value={filters.toYear ?? ''}
          onChange={(e) => patch({ toYear: parseYear(e.target.value) })}
          placeholder="2039"
        />
      </div>

      <div className={s.group} style={{ flex: '1 1 200px' }}>
        <Search size={16} aria-hidden />
        <Input
          className={s.search}
          type="search"
          value={filters.search ?? ''}
          onChange={(e) =>
            patch({ search: e.target.value === '' ? undefined : e.target.value })
          }
          placeholder="Hledat v ose…"
        />
      </div>

      <div className={s.group}>
        <div className={s.sortToggle} role="group" aria-label="Pořadí">
          {(['desc', 'asc'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              className={`${s.sortBtn} ${sort === opt ? s.sortBtnActive : ''}`}
              onClick={() => patch({ sort: opt })}
              aria-pressed={sort === opt}
            >
              {SORT_LABELS[opt]}
            </button>
          ))}
        </div>
      </div>

      <div className={s.spacer} />

      <Button
        variant="ghost"
        className={s.scrubberToggle}
        onClick={onScrubberToggle}
        aria-label="Skok na rok"
      >
        <Calendar size={16} aria-hidden /> Skok na rok
      </Button>

      {canWrite && (
        <Button variant="primary" onClick={onAddClick}>
          <Plus size={16} aria-hidden /> Nová událost
        </Button>
      )}
    </div>
  );
}
