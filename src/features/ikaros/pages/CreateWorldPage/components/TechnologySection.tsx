import { TECH_LEVELS } from '../constants/technologyLevels';
import { SectionCard } from './SectionCard';
import s from './sections.module.css';

interface Props {
  min: number;
  max: number;
  onMinChange: (v: number) => void;
  onMaxChange: (v: number) => void;
}

/**
 * 2.3d — volba technologického pásma světa (od–do na škále TÚ 0–14).
 * Rozsah se při založení vypíše na referenční stránku Technologie, kde ho PJ
 * dál upravuje. Po založení se nenastavuje v Nastavení světa.
 */
export function TechnologySection({
  min,
  max,
  onMinChange,
  onMaxChange,
}: Props) {
  // Clamp — „od" nesmí být výš než „do" a naopak.
  function handleMin(v: number) {
    onMinChange(v);
    if (v > max) onMaxChange(v);
  }
  function handleMax(v: number) {
    onMaxChange(v);
    if (v < min) onMinChange(v);
  }

  return (
    <SectionCard
      index={6}
      title="Technologie"
      description="Jak vyspělá je technika ve světě. Vyber běžné pásmo (od–do) — vypíše se na stránku Technologie, kde ho doladíš. Tady se nastavuje jen při tvorbě."
    >
      <div className={s.evenCols}>
        <div className={s.field}>
          <label htmlFor="cw-tech-min" className={s.label}>
            Běžně od
          </label>
          <select
            id="cw-tech-min"
            className={s.select}
            value={min}
            onChange={(e) => handleMin(Number(e.target.value))}
          >
            {TECH_LEVELS.map((t) => (
              <option key={t.level} value={t.level}>
                TÚ {t.level} — {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className={s.field}>
          <label htmlFor="cw-tech-max" className={s.label}>
            do
          </label>
          <select
            id="cw-tech-max"
            className={s.select}
            value={max}
            onChange={(e) => handleMax(Number(e.target.value))}
          >
            {TECH_LEVELS.map((t) => (
              <option key={t.level} value={t.level}>
                TÚ {t.level} — {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </SectionCard>
  );
}
