/**
 * 8.7i — Sdílená skill pip komponenta (Fate / PI).
 * 1:1 z `PiCharacterSheet.tsx renderSkillPips`.
 *
 * 6 pipů; klik na pip N nastaví hodnocení na N+1, klik na nejvyšší
 * vyplněný pip ho sníží. Pro view mode (disabled) jen zobrazí stav.
 */

interface Props {
  /** Aktuální hodnocení (0–6). */
  value: number;
  /** Volá se s novým hodnocením po kliknutí. */
  onChange: (next: number) => void;
  disabled?: boolean;
  /** ARIA-label prefix (typicky název dovednosti). */
  ariaLabelPrefix?: string;
}

const MAX_PIPS = 6;

export function SkillPips({
  value,
  onChange,
  disabled,
  ariaLabelPrefix = 'Pip',
}: Props) {
  const toggle = (pipIndex: number) => {
    if (disabled) return;
    if (value === pipIndex + 1) {
      onChange(pipIndex);
    } else {
      onChange(pipIndex + 1);
    }
  };

  return (
    <div className="s-tracker">
      {Array.from({ length: MAX_PIPS }).map((_, i) => (
        <button
          type="button"
          key={i}
          className={`pip ${i < value ? 'filled' : ''}`}
          onClick={() => toggle(i)}
          disabled={disabled}
          title={`Hodnocení ${i + 1}`}
          aria-label={`${ariaLabelPrefix} ${i + 1} z ${MAX_PIPS}`}
          aria-pressed={i < value}
        />
      ))}
    </div>
  );
}
