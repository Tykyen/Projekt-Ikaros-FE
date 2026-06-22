import { useState } from 'react';
import { Eye, Users, UserX } from 'lucide-react';
import { useAnalyticsSummary } from '../../api/useAnalyticsSummary';
import type {
  AnalyticsDays,
  ReferrerCategory,
} from '../../api/analytics.types';
import { StatCard } from '../OverviewTab/StatCard';
import { MiniBarChart } from './MiniBarChart';
import s from './AnalyticsSection.module.css';

const DAYS_OPTIONS: { value: AnalyticsDays; label: string }[] = [
  { value: 7, label: '7 dní' },
  { value: 30, label: '30 dní' },
  { value: 90, label: '90 dní' },
];

const SOURCE_LABELS: Record<ReferrerCategory, string> = {
  search: 'Vyhledávač',
  social: 'Sociální sítě',
  internal: 'Interní proklik',
  referral: 'Odkaz odjinud',
  direct: 'Přímo',
};

/**
 * 15B.7 — sekce „Návštěvnost" v admin Přehledu. Self-hosted analytics:
 * karty + denní trend (CSS graf) + top stránky + zdroje. Přepínač období.
 */
export function AnalyticsSection() {
  const [days, setDays] = useState<AnalyticsDays>(7);
  const { data, isLoading, isError } = useAnalyticsSummary(days);

  const totals = data?.totals;
  const anonPct = totals ? Math.round(totals.anonShare * 100) : 0;
  const topMax = Math.max(1, ...(data?.topPaths ?? []).map((p) => p.views));
  const srcMax = Math.max(1, ...(data?.sources ?? []).map((p) => p.views));

  return (
    <section className={s.section}>
      <div className={s.head}>
        <h2 className={s.sectionTitle}>Návštěvnost</h2>
        <div className={s.range} role="group" aria-label="Období">
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
          Návštěvnost se nepodařilo načíst. Zkus obnovit stránku.
        </p>
      )}

      <div className={s.grid}>
        <StatCard
          label="Návštěvy"
          value={totals?.views ?? 0}
          icon={<Eye />}
          index={0}
          loading={isLoading}
        />
        <StatCard
          label="Návštěvníci"
          value={totals?.visitors ?? 0}
          icon={<Users />}
          index={1}
          loading={isLoading}
        />
        <StatCard
          label="Podíl anonymních"
          value={`${anonPct} %`}
          icon={<UserX />}
          index={2}
          loading={isLoading}
        />
      </div>

      {data && data.totals.views > 0 ? (
        <>
          <div className={s.chartWrap}>
            <span className={s.blockLabel}>Denní trend</span>
            <MiniBarChart data={data.daily} />
          </div>

          <div className={s.cols}>
            <div className={s.block}>
              <span className={s.blockLabel}>Nejnavštěvovanější stránky</span>
              <ul className={s.barList}>
                {data.topPaths.map((p) => (
                  <li key={p.path} className={s.barRow}>
                    <span className={s.barFill} style={barWidth(p.views, topMax)} />
                    <span className={s.barText} title={p.path}>
                      {p.path}
                    </span>
                    <span className={s.barValue}>{p.views}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={s.block}>
              <span className={s.blockLabel}>Zdroje návštěv</span>
              <ul className={s.barList}>
                {data.sources.map((src) => (
                  <li key={src.category} className={s.barRow}>
                    <span
                      className={s.barFill}
                      style={barWidth(src.views, srcMax)}
                    />
                    <span className={s.barText}>
                      {SOURCE_LABELS[src.category] ?? src.category}
                    </span>
                    <span className={s.barValue}>{src.views}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      ) : (
        !isLoading &&
        !isError && (
          <p className={s.empty}>
            Zatím žádná data — měření běží od nasazení (boti a prerender se
            nepočítají).
          </p>
        )
      )}
    </section>
  );
}

function barWidth(value: number, max: number): React.CSSProperties {
  return { width: `${Math.max(4, Math.round((value / max) * 100))}%` };
}
