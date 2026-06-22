import s from './AnalyticsSection.module.css';

export interface MiniBarDatum {
  date: string; // YYYY-MM-DD
  views: number;
  visitors: number;
}

/**
 * 15B.7 — lehký CSS sloupcový graf denní návštěvnosti (žádný chart dep).
 * Výška sloupce = views / max. Tooltip (title) nese datum + počty.
 */
export function MiniBarChart({ data }: { data: MiniBarDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.views));
  return (
    <div className={s.chart} role="img" aria-label="Denní návštěvnost">
      {data.map((d) => {
        const pct = Math.round((d.views / max) * 100);
        return (
          <div
            key={d.date}
            className={s.bar}
            style={{ height: `${Math.max(2, pct)}%` }}
            title={`${formatDay(d.date)} · ${d.views} návštěv · ${d.visitors} návštěvníků`}
          />
        );
      })}
    </div>
  );
}

/** YYYY-MM-DD → „12. 6." (krátké CZ datum pro tooltip). */
function formatDay(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${Number(d)}. ${Number(m)}.`;
}
