import { DICE, DICE_DESCRIPTIONS } from '../constants/dice';
import { RPG_SYSTEMS, SYSTEM_CUSTOM_ID } from '../constants/systems';
import { PillChips } from './PillChips';
import { DicePresetResetLink } from './DicePresetResetLink';
import { SectionCard } from './SectionCard';
import s from './sections.module.css';

interface Props {
  system: string;
  customSystem: string;
  dice: string[];
  onSystemChange: (v: string) => void;
  onCustomSystemChange: (v: string) => void;
  onDiceChange: (v: string[]) => void;
}

export function SystemSection({
  system,
  customSystem,
  dice,
  onSystemChange,
  onCustomSystemChange,
  onDiceChange,
}: Props) {
  const showCustom = system === SYSTEM_CUSTOM_ID;

  return (
    <SectionCard
      index={5}
      title="Herní systém"
      description="Vybraný systém ovlivní, v jakém uspořádání se budou hráčům a příšerám kreslit deníky v Taktické mapě."
      fullWidth
    >
      <div className={s.field}>
        <label htmlFor="cw-system" className={`${s.label} ${s.required}`}>
          Systém
        </label>
        <select
          id="cw-system"
          className={s.select}
          value={system}
          onChange={(e) => onSystemChange(e.target.value)}
        >
          {RPG_SYSTEMS.map((sys) => (
            <option key={sys.id} value={sys.id}>
              {sys.label}
            </option>
          ))}
        </select>
        {showCustom && (
          <input
            type="text"
            className={`${s.input} ${s.customInput}`}
            value={customSystem}
            onChange={(e) => onCustomSystemChange(e.target.value)}
            maxLength={60}
            placeholder="Pojmenuj svůj systém…"
            autoComplete="off"
          />
        )}
      </div>

      <div className={s.field}>
        <span className={s.label}>Kostky / mechaniky</span>
        <p className={s.helper}>
          Předvyplněno podle systému — uprav podle libosti. Nepovinné.
        </p>
        <PillChips
          options={DICE}
          value={dice}
          onChange={onDiceChange}
          ariaLabel="Kostky a mechaniky"
          descriptions={DICE_DESCRIPTIONS}
        />
        <DicePresetResetLink
          system={system}
          dice={dice}
          onApply={onDiceChange}
        />
      </div>
    </SectionCard>
  );
}
