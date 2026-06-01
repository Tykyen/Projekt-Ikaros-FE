import { SUBJECT_TYPES, TYPE_LABELS } from '../labels';
import { typeCssVar } from '../campaignColors';
import s from './campaign.module.css';

/** Legenda grafu — typy uzlů + valence škála. */
export function GraphLegend() {
  return (
    <div className={s.legend}>
      <div className={s.legendGroup}>
        <span className={s.legendGroupLabel}>Subjekty:</span>
        {SUBJECT_TYPES.map((t) => (
          <span key={t} className={s.legendItem}>
            <span
              className={s.legendDot}
              style={{ background: typeCssVar(t) }}
            />
            {TYPE_LABELS[t]}
          </span>
        ))}
      </div>
      <div className={s.legendGroup}>
        <span className={s.legendGroupLabel}>Vztahy:</span>
        <span className={s.legendItem}>
          <span
            className={s.legendDot}
            style={{ background: 'var(--cmp-val-neg)' }}
          />
          nepřátelství
        </span>
        <span className={s.legendItem}>
          <span
            className={s.legendDot}
            style={{ background: 'var(--cmp-val-zero)' }}
          />
          neutrál
        </span>
        <span className={s.legendItem}>
          <span
            className={s.legendDot}
            style={{ background: 'var(--cmp-val-pos)' }}
          />
          přátelství
        </span>
      </div>
    </div>
  );
}
