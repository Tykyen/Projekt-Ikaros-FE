import { useMemo } from 'react';
import { Badge } from '@/shared/ui';
import { PriorityPips } from './Bits';
import type {
  CampaignRelationship,
  CampaignStoryline,
  CampaignSubject,
} from '../types';
import s from './campaign.module.css';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'teď';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} d`;
}

/**
 * Dashboard „Dnes" — počítá se klientsky z aktuální vrstvy (funguje stejně pro
 * moji i hráčovu read-only vrstvu). Připnuté poznámky přijdou v 11.3.
 */
export function DnesTab({
  subjects,
  relationships,
  storylines,
  onGoSubject,
  onGoRelationship,
}: {
  subjects: CampaignSubject[];
  relationships: CampaignRelationship[];
  storylines: CampaignStoryline[];
  onGoSubject: (id: string) => void;
  onGoRelationship: (rel: CampaignRelationship) => void;
}) {
  const nameOf = (id: string) => subjects.find((x) => x.id === id)?.name ?? '?';

  const crisis = useMemo(
    () =>
      relationships
        .filter((r) => r.status === 'crisis')
        .sort((a, b) => b.priority - a.priority),
    [relationships],
  );
  const active = useMemo(
    () => storylines.filter((sl) => sl.status === 'active'),
    [storylines],
  );
  const recent = useMemo(() => {
    const items = [
      ...subjects.map((x) => ({
        kind: 'subject' as const,
        id: x.id,
        label: x.name,
        at: x.updatedAt,
        data: x,
      })),
      ...relationships.map((x) => ({
        kind: 'relationship' as const,
        id: x.id,
        label: `${nameOf(x.subjectAId)} ↔ ${nameOf(x.subjectBId)}`,
        at: x.updatedAt,
        data: x,
      })),
    ];
    return items
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects, relationships]);

  return (
    <div className={s.dashboard}>
      <section className={s.dashCard}>
        <div className={s.dashHead}>
          ⚠ Vztahy v krizi <span className={s.dashCount}>{crisis.length}</span>
        </div>
        <div className={s.dashList}>
          {crisis.length === 0 ? (
            <div className={s.empty}>Žádné krizové vztahy</div>
          ) : (
            crisis.map((r) => (
              <button
                type="button"
                key={r.id}
                className={s.dashItem}
                onClick={() => onGoRelationship(r)}
              >
                <span className={s.dashItemTitle}>
                  {nameOf(r.subjectAId)} ↔ {nameOf(r.subjectBId)}
                </span>
                <PriorityPips value={r.priority} />
              </button>
            ))
          )}
        </div>
      </section>

      <section className={s.dashCard}>
        <div className={s.dashHead}>
          ▶ Aktivní linky <span className={s.dashCount}>{active.length}</span>
        </div>
        <div className={s.dashList}>
          {active.length === 0 ? (
            <div className={s.empty}>Žádné aktivní linky</div>
          ) : (
            active.map((sl) => (
              <div key={sl.id} className={s.dashItem}>
                <span className={s.dashItemTitle}>{sl.title}</span>
                {sl.nextStep && (
                  <span className={s.dashItemSub}>→ {sl.nextStep}</span>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <section className={s.dashCard}>
        <div className={s.dashHead}>🕓 Poslední změny</div>
        <div className={s.dashList}>
          {recent.length === 0 ? (
            <div className={s.empty}>Zatím nic</div>
          ) : (
            recent.map((it) => (
              <button
                type="button"
                key={`${it.kind}-${it.id}`}
                className={s.dashItem}
                onClick={() =>
                  it.kind === 'subject'
                    ? onGoSubject(it.id)
                    : onGoRelationship(it.data as CampaignRelationship)
                }
              >
                <span className={s.dashItemTitle}>
                  <Badge>{it.kind === 'subject' ? 'Subjekt' : 'Vztah'}</Badge>{' '}
                  {it.label}
                </span>
                <span className={s.dashItemSub}>{timeAgo(it.at)}</span>
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
