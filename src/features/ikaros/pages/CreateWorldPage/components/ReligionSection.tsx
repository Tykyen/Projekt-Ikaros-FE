import {
  RELIGION_LEVELS,
  RELIGION_TYPES,
  RELIGION_TYPE_DESCRIPTIONS,
} from '../constants/religion';
import { PillChips } from './PillChips';
import { SectionCard } from './SectionCard';
import s from './sections.module.css';

interface Props {
  influence: number;
  types: string[];
  onInfluenceChange: (v: number) => void;
  onTypesChange: (v: string[]) => void;
}

/**
 * 2.3g — role náboženství (osa 0–14) + typy náboženství světa. Volby se při
 * založení vypíšou na stránku Náboženství, kde je PJ dál upravuje. Po založení
 * se nenastavuje v Nastavení světa.
 */
export function ReligionSection({
  influence,
  types,
  onInfluenceChange,
  onTypesChange,
}: Props) {
  return (
    <SectionCard
      index={8}
      title="Náboženství"
      description="Jakou roli hraje víra ve světě a jaké typy náboženství se v něm vyskytují. Vypíše se na stránku Náboženství i s osnovou, co u víry řešit. Tady se nastavuje jen při tvorbě."
    >
      <div className={s.field}>
        <label htmlFor="cw-religion-influence" className={s.label}>
          Role náboženství
        </label>
        <select
          id="cw-religion-influence"
          className={s.select}
          value={influence}
          onChange={(e) => onInfluenceChange(Number(e.target.value))}
        >
          {RELIGION_LEVELS.map((r) => (
            <option key={r.level} value={r.level}>
              {r.level} — {r.name}
            </option>
          ))}
        </select>
        <p className={s.helper}>
          Od sekulárního světa (0) přes organizovanou církev po realitu, kde
          bohové chodí mezi lidmi (14).
        </p>
      </div>

      <div className={s.field}>
        <span className={s.label}>Typy náboženství</span>
        <PillChips
          options={RELIGION_TYPES}
          value={types}
          onChange={onTypesChange}
          ariaLabel="Typy náboženství"
          descriptions={RELIGION_TYPE_DESCRIPTIONS}
        />
      </div>
    </SectionCard>
  );
}
