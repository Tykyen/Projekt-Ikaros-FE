import { useThemeUsageStats } from '../../api/useThemeUsageStats';
import {
  analyzeThemeUsage,
  type DimensionView,
  type UsageRow,
} from './themeUsage.lib';
import s from './ThemeUsageSection.module.css';

/**
 * 20.6 — sekce „Motivy a skiny" v admin Přehledu. Read-only přehled využití
 * všech vizuálních voleb (5 dimenzí) jako podklad pro osekání málo využívaných.
 * Snapshot z `GET /admin/stats/theme-usage`. Vzor: GrowthSection / CostsSection.
 */
export function ThemeUsageSection() {
  const { data, isLoading, isError } = useThemeUsageStats();
  const view = data ? analyzeThemeUsage(data) : null;

  return (
    <section className={s.section}>
      <div className={s.head}>
        <h2 className={s.sectionTitle}>Motivy a skiny</h2>
      </div>

      {isError && (
        <p className={s.error} role="alert">
          Využití motivů a skinů se nepodařilo načíst. Zkus obnovit stránku.
        </p>
      )}
      {isLoading && !view && <p className={s.empty}>Načítám…</p>}

      {view && (
        <>
          <Summary fullyUnused={view.fullyUnused} />
          {view.dimensions.map((d) => (
            <DimensionBlock key={d.key} dim={d} />
          ))}
          <p className={s.disclaimer}>
            „Bez volby" znamená <strong>dědí výchozí</strong> motiv, ne
            nevyužité. <strong>Kandidát na osekání</strong> = 0 vědomých voleb
            všude, kde se motiv/skin nabízí. Snímek k{' '}
            {new Date(view.generatedAt).toLocaleString('cs-CZ')}.
          </p>
        </>
      )}
    </section>
  );
}

/** Souhrn kandidátů na osekání nad bloky. */
function Summary({
  fullyUnused,
}: {
  fullyUnused: { themes: { id: string; label: string }[]; skins: { id: string; label: string }[] };
}) {
  const { themes, skins } = fullyUnused;
  if (themes.length === 0 && skins.length === 0) {
    return (
      <div className={s.summary}>
        <span className={s.summaryOk}>
          ✓ Každý motiv i skin má aspoň jednoho vědomého uživatele — není co
          osekávat.
        </span>
      </div>
    );
  }
  return (
    <div className={s.summary}>
      <span>
        <span className={s.summaryStrong}>Kandidáti na osekání</span> (nikdo si
        je vědomě nevybral): {themes.length} motivů · {skins.length} skinů.
      </span>
      {themes.length > 0 && (
        <div className={s.chips}>
          {themes.map((t) => (
            <span key={t.id} className={s.chipCandidate}>
              {t.label}
            </span>
          ))}
        </div>
      )}
      {skins.length > 0 && (
        <div className={s.chips}>
          {skins.map((sk) => (
            <span key={sk.id} className={s.chipCandidate}>
              {sk.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Jeden podblok = jedna dimenze (bar list seřazený dle využití). */
function DimensionBlock({ dim }: { dim: DimensionView }) {
  return (
    <div className={s.block}>
      <span className={s.blockLabel}>
        {dim.title}{' '}
        <span className={s.blockNote}>
          ({dim.total.toLocaleString('cs-CZ')} {dim.unit} · {dim.noChoice}{' '}
          {dim.noChoiceHint})
        </span>
      </span>
      <div className={s.bars}>
        {dim.rows.map((r) => (
          <BarRow key={r.id} row={r} max={dim.max} />
        ))}
      </div>
      {dim.candidateCount > 0 && (
        <span className={s.candNote}>
          {dim.candidateCount}× 0 vědomých voleb v této dimenzi.
        </span>
      )}
    </div>
  );
}

function BarRow({ row, max }: { row: UsageRow; max: number }) {
  const pct = row.effective === 0 ? 0 : Math.max(2, (row.effective / max) * 100);
  return (
    <div className={s.barRow}>
      <span className={s.barLabel}>
        <span className={s.barName}>{row.label}</span>
        {row.isDefault && <span className={s.chipDefault}>výchozí</span>}
        {row.isCandidate && <span className={s.chipCandidate}>nevyužité</span>}
        {row.isLegacy && <span className={s.chipLegacy}>mimo nabídku</span>}
      </span>
      <span className={s.barTrack} aria-hidden="true">
        <span className={s.barFill} style={{ width: `${pct}%` }} />
      </span>
      <span className={s.barValue}>
        {row.explicit.toLocaleString('cs-CZ')}
        {row.isDefault && row.effective > row.explicit && (
          <span className={s.barInherited}>
            {' '}
            +{(row.effective - row.explicit).toLocaleString('cs-CZ')}
          </span>
        )}
      </span>
    </div>
  );
}
