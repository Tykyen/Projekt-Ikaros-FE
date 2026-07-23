import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Badge, Button } from '@/shared/ui';
import { SUBJECT_TYPES, TYPE_LABELS } from '../labels';
import { typeCssVar } from '../campaignColors';
import type { CampaignSubject, CampaignSubjectType } from '../types';
import { SubjectAvatar } from './SubjectAvatar';
import s from './campaign.module.css';

/** Levý panel — hledání, filtr typu, seznam subjektů. */
export function SubjectRail({
  subjects,
  selectedId,
  canAdd,
  imageFor,
  onSelect,
  onAdd,
}: {
  subjects: CampaignSubject[];
  selectedId: string | null;
  canAdd: boolean;
  imageFor: (s: CampaignSubject) => string | undefined;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CampaignSubjectType | ''>('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subjects.filter((x) => {
      if (typeFilter && x.type !== typeFilter) return false;
      if (!q) return true;
      return (
        x.name.toLowerCase().includes(q) ||
        x.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [subjects, search, typeFilter]);

  return (
    <div className={s.rail}>
      <div className={s.railHead}>
        <span className={s.railTitle}>Subjekty</span>
        {canAdd && (
          <Button
            size="sm"
            onClick={onAdd}
            aria-label="Přidat subjekt"
            data-vypravec="pavucina-novy-subjekt"
          >
            +
          </Button>
        )}
      </div>
      <input
        className={s.input}
        placeholder="Hledat…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className={s.chips}>
        <button
          type="button"
          className={clsx(s.chip, !typeFilter && s.chipOn)}
          onClick={() => setTypeFilter('')}
        >
          Vše
        </button>
        {SUBJECT_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            className={clsx(s.chip, typeFilter === t && s.chipOn)}
            onClick={() => setTypeFilter(t)}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>
      <div className={s.railList}>
        {filtered.map((x) => (
          <button
            type="button"
            key={x.id}
            className={clsx(s.railItem, selectedId === x.id && s.railItemOn)}
            onClick={() => onSelect(x.id)}
          >
            <SubjectAvatar subject={x} size={32} imageUrl={imageFor(x)} />
            <span className={s.railItemBody}>
              <span className={s.railItemName}>{x.name}</span>
              <Badge style={{ color: typeCssVar(x.type) }}>
                {TYPE_LABELS[x.type]}
              </Badge>
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className={s.empty}>Žádné subjekty</div>
        )}
      </div>
    </div>
  );
}
