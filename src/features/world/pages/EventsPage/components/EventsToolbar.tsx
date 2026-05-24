import clsx from 'clsx';
import { Plus } from 'lucide-react';
import { WorldRole } from '@/shared/types';
import { Button } from '@/shared/ui';
import s from './EventsToolbar.module.css';

export type EventsView = 'upcoming' | 'archive';

interface Props {
  viewerRole: WorldRole;
  view: EventsView;
  onViewChange: (v: EventsView) => void;
  groupFilter: string;
  onGroupFilterChange: (g: string) => void;
  customGroups: string[];
  groupColors: Record<string, string>;
  onCreate: () => void;
}

/**
 * 9.1-I — toolbar nad stránkou /svet/:slug/akce.
 *
 * Filter chip `Nadcházející | Archiv` vidí jen PomocnyPJ+ (spec §6, §8.2).
 * „+ Nová akce" také jen PomocnyPJ+.
 */
export function EventsToolbar({
  viewerRole,
  view,
  onViewChange,
  groupFilter,
  onGroupFilterChange,
  customGroups,
  groupColors,
  onCreate,
}: Props) {
  const canSeeArchive = viewerRole >= WorldRole.PomocnyPJ;
  const canCreate = viewerRole >= WorldRole.PomocnyPJ;

  return (
    <div className={s.toolbar}>
      {canSeeArchive && (
        <div
          className={s.chipGroup}
          role="tablist"
          aria-label="Pohled na akce"
        >
          <button
            type="button"
            role="tab"
            aria-selected={view === 'upcoming'}
            className={clsx(s.chip, view === 'upcoming' && s.chipActive)}
            onClick={() => onViewChange('upcoming')}
          >
            Nadcházející
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'archive'}
            className={clsx(s.chip, view === 'archive' && s.chipActive)}
            onClick={() => onViewChange('archive')}
          >
            Archiv
          </button>
        </div>
      )}

      <div className={s.spacer} />

      {customGroups.length > 0 && (
        <label className={s.groupFilter}>
          <span className={s.groupFilterLabel}>Skupina:</span>
          <select
            value={groupFilter}
            onChange={(e) => onGroupFilterChange(e.target.value)}
            className={s.groupSelect}
          >
            <option value="">Všechny</option>
            {customGroups.map((g) => (
              <option
                key={g}
                value={g}
                style={
                  groupColors[g] ? { color: groupColors[g] } : undefined
                }
              >
                {g}
              </option>
            ))}
          </select>
        </label>
      )}

      {canCreate && (
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onCreate}
        >
          <Plus size={16} aria-hidden="true" /> Nová akce
        </Button>
      )}
    </div>
  );
}
