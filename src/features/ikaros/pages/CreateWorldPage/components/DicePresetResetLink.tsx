import { getDicePreset, diceMatchesPreset } from '../constants/systemDicePresets';
import s from './sections.module.css';

interface Props {
  /** Aktuální `system` id. */
  system: string;
  /** Aktuální výběr kostek. */
  dice: string[];
  /** Aplikuje preset systému (explicitní akce — přepíše i ruční úpravy). */
  onApply: (dice: string[]) => void;
}

/**
 * 2.3b — odkaz „Obnovit doporučené kostky pro systém".
 *
 * Skryje se, když systém preset nemá (`vlastni`) nebo když výběr už presetu
 * odpovídá (není co obnovovat).
 */
export function DicePresetResetLink({ system, dice, onApply }: Props) {
  const preset = getDicePreset(system);
  if (preset.length === 0 || diceMatchesPreset(system, dice)) return null;

  return (
    <button
      type="button"
      className={s.resetLink}
      onClick={() => onApply(preset)}
    >
      Obnovit doporučené kostky pro systém
    </button>
  );
}
