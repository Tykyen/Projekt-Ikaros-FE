import { forwardRef } from 'react';
import { Dices } from 'lucide-react';
import styles from './DiceButton.module.css';

interface DiceButtonProps {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}

/**
 * Krok 6.3a — 🎲 razítko v composer toolbaru. 32×32, ikona lucide `Dices`.
 *
 * Vizuálně sladěné s ostatními razítky 6.2 (📎 NPC RP 🎨 @ 😊) —
 * `active` = popover open (border + výplň v `--ch-accent`).
 */
export const DiceButton = forwardRef<HTMLButtonElement, DiceButtonProps>(
  ({ active, disabled, onClick }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={`${styles.btn} ${active ? styles.active : ''}`}
        onClick={onClick}
        disabled={disabled}
        title="Hod kostkou"
        aria-label="Hod kostkou"
        aria-pressed={active}
      >
        <Dices size={18} aria-hidden="true" />
      </button>
    );
  },
);

DiceButton.displayName = 'DiceButton';
