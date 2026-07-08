import { useState } from 'react';
import { UserCheck, Magnet, CalendarDays, CalendarRange } from 'lucide-react';
import { useGrowthStats } from '../../api/useGrowthStats';
import type { GrowthDays } from '../../api/growth.types';
import { StatCard } from '../OverviewTab/StatCard';
import { FunnelChart } from './FunnelChart';
import s from './GrowthSection.module.css';

const DAYS_OPTIONS: { value: GrowthDays; label: string }[] = [
  { value: 7, label: '7 dní' },
  { value: 30, label: '30 dní' },
  { value: 90, label: '90 dní' },
];

const pct = (v: number) => `${Math.round(v * 100)} %`;

/**
 * 19.1 — sekce „Růst & retence" v admin Přehledu. Odvozené z DB (žádný nový
 * tracking): onboarding trychtýř + retenční ukazatele + akviziční poměr.
 * ⚠️ Retence jsou snapshoty k dnešku, ne časové řady (chybí historie aktivity —
 * spec 19.1 §4). UI to čestně označuje.
 */
export function GrowthSection() {
  const [days, setDays] = useState<GrowthDays>(30);
  const { data, isLoading, isError } = useGrowthStats(days);

  const r = data?.retention;
  const a = data?.acquisition;
  const cohortMax = Math.max(1, ...(r?.cohorts ?? []).map((c) => c.registered));

  return (
    <section className={s.section}>
      <div className={s.head}>
        <h2 className={s.sectionTitle}>Růst &amp; retence</h2>
        <div className={s.range} role="group" aria-label="Období nováčků">
          {DAYS_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={o.value === days ? s.rangeBtnActive : s.rangeBtn}
              onClick={() => setDays(o.value)}
              aria-pressed={o.value === days}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {isError && (
        <p className={s.error} role="alert">
          Metriky růstu se nepodařilo načíst. Zkus obnovit stránku.
        </p>
      )}

      {/* ── Onboarding trychtýř ─────────────────────────────────────── */}
      <div className={s.block}>
        <span className={s.blockLabel}>
          Onboarding trychtýř{' '}
          <span className={s.blockNote}>
            (celkem · +číslo = z nováčků za {days} dní)
          </span>
        </span>
        {isLoading || !data ? (
          <p className={s.empty}>{isError ? '' : 'Načítám…'}</p>
        ) : data.funnel.steps[0]?.total === 0 ? (
          <p className={s.empty}>Zatím žádní registrovaní uživatelé.</p>
        ) : (
          <FunnelChart steps={data.funnel.steps} />
        )}
      </div>

      {/* ── Retenční karty ──────────────────────────────────────────── */}
      <div className={s.grid}>
        <StatCard
          label="Vrátilo se po registraci"
          value={r ? pct(r.activationRate) : '—'}
          icon={<UserCheck />}
          index={0}
          loading={isLoading}
        />
        <StatCard
          label="Lepkavost (WAU/MAU)"
          value={r ? pct(r.stickiness) : '—'}
          icon={<Magnet />}
          index={1}
          loading={isLoading}
        />
        <StatCard
          label="Aktivní (7 dní)"
          value={r?.wau ?? 0}
          icon={<CalendarDays />}
          index={2}
          loading={isLoading}
        />
        <StatCard
          label="Aktivní (30 dní)"
          value={r?.mau ?? 0}
          icon={<CalendarRange />}
          index={3}
          loading={isLoading}
        />
      </div>
      <p className={s.disclaimer}>
        Retence je stav k dnešku (kolik dřívějších uživatelů je pořád aktivních).
        Skutečnou týden‑po‑týdnu křivku zatím neměříme — chybí historie aktivity.
      </p>

      {/* ── Survival kohorty ────────────────────────────────────────── */}
      {r && r.cohorts.length > 0 && (
        <div className={s.block}>
          <span className={s.blockLabel}>
            Kohorty podle měsíce registrace{' '}
            <span className={s.blockNote}>(kolik z nich drží dodnes)</span>
          </span>
          <div className={s.tableWrap}>
            <table className={s.cohortTable}>
              <thead>
                <tr>
                  <th>Měsíc</th>
                  <th>Registrací</th>
                  <th>Aktivních</th>
                  <th className={s.cohortHoldCol}>Drží</th>
                </tr>
              </thead>
              <tbody>
                {r.cohorts.map((c) => {
                  const hold =
                    c.registered > 0
                      ? Math.round((c.active / c.registered) * 100)
                      : 0;
                  return (
                    <tr key={c.month}>
                      <td>{c.month}</td>
                      <td className={s.num}>
                        <span
                          className={s.cohortReg}
                          style={{
                            width: `${Math.round((c.registered / cohortMax) * 100)}%`,
                          }}
                          aria-hidden
                        />
                        <span className={s.numText}>{c.registered}</span>
                      </td>
                      <td className={s.num}>
                        <span className={s.numText}>{c.active}</span>
                      </td>
                      <td className={s.cohortHoldCol}>
                        <span className={s.holdBadge}>{hold} %</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Akvizice ────────────────────────────────────────────────── */}
      {a && (
        <div className={s.block}>
          <span className={s.blockLabel}>
            Akvizice za {days} dní{' '}
            <span className={s.blockNote}>(z anonymní návštěvnosti)</span>
          </span>
          <div className={s.acqRow}>
            <span className={s.acqStep}>
              <b>{a.visitors.toLocaleString('cs-CZ')}</b> návštěvníků
            </span>
            <span className={s.acqArrow} aria-hidden>
              →
            </span>
            <span className={s.acqStep}>
              <b>{a.signups.toLocaleString('cs-CZ')}</b> registrací
            </span>
            <span className={s.acqArrow} aria-hidden>
              =
            </span>
            <span className={s.acqRate}>
              {a.signupRate !== null ? pct(a.signupRate) : '—'}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
