/**
 * 8.7i — Sdílený konflikt tracker (Fate / PI).
 * 5-stavový lineární tracker (V pořádku → Vyřazen).
 * 1:1 z `PiCharacterSheet.tsx renderConflictTrack`.
 */

const STATES = [
  { id: 0, label: 'V pořádku', type: 'normal' as const },
  { id: 1, label: 'Lehké zranění', type: 'warning' as const },
  { id: 2, label: 'Těžší zranění', type: 'danger' as const },
  { id: 3, label: 'Vážnější násl.', type: 'critical' as const },
  { id: 4, label: 'Vyřazen', type: 'critical' as const },
];

interface Props {
  value: number; // 0..4
  onChange: (next: number) => void;
  disabled?: boolean;
}

export function ConflictTrack({ value, onChange, disabled }: Props) {
  return (
    <div className="conflict-track">
      {STATES.map((s) => (
        <button
          type="button"
          key={s.id}
          className={`state-node ${value === s.id ? 'active' : ''} ${value === s.id ? s.type : ''}`}
          onClick={() => !disabled && onChange(s.id)}
          disabled={disabled}
          aria-label={`Stav: ${s.label}`}
          aria-pressed={value === s.id}
        >
          <div className="node-circle"></div>
          <div className="node-label">{s.label}</div>
        </button>
      ))}
    </div>
  );
}
