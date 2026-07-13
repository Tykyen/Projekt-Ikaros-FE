/**
 * 21.5b — editační seznam surovin lektvaru (spec R3: min. 1, co + kolik).
 * Dynamické řádky surovina|množství|✕ + přidat — reuse extraRow stylů kouzel.
 */
import type { PotionIngredient } from '../types';
import s from '../../kouzla/components/KouzlaForms.module.css';

interface Props {
  value: PotionIngredient[];
  onChange: (next: PotionIngredient[]) => void;
  error?: string;
}

export function IngredientsFields({ value, onChange, error }: Props) {
  const rows = value.length ? value : [{ name: '', amount: '' }];
  return (
    <div className={s.field}>
      <span className={s.label}>
        Suroviny <span className={s.req}>*</span>
      </span>
      <span className={s.fieldHint}>
        Co je k uvaření potřeba a kolik (např. „květ anděliky — 2×").
      </span>
      {rows.map((ing, i) => (
        <div className={s.extraRow} key={i}>
          <input
            className={s.input}
            value={ing.name}
            placeholder="Surovina (např. květ anděliky)"
            aria-label={`Surovina ${i + 1}`}
            maxLength={120}
            onChange={(e) =>
              onChange(
                rows.map((x, j) =>
                  j === i ? { ...x, name: e.target.value } : x,
                ),
              )
            }
          />
          <input
            className={s.input}
            value={ing.amount ?? ''}
            placeholder="Množství (např. 2× / hrst)"
            aria-label={`Množství suroviny ${i + 1}`}
            maxLength={60}
            onChange={(e) =>
              onChange(
                rows.map((x, j) =>
                  j === i ? { ...x, amount: e.target.value } : x,
                ),
              )
            }
          />
          <button
            type="button"
            className={s.extraRemove}
            aria-label="Odebrat surovinu"
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
          >
            ✕
          </button>
        </div>
      ))}
      <div>
        <button
          type="button"
          className={s.extraAdd}
          onClick={() => onChange([...rows, { name: '', amount: '' }])}
        >
          ＋ Přidat surovinu
        </button>
      </div>
      {error ? <span className={s.fieldErr}>{error}</span> : null}
    </div>
  );
}
