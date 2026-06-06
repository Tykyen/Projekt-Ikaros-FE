import { HelpCircle } from 'lucide-react';
import s from './WorldHelp.module.css';

/** Jednotné ikonové tlačítko „?" pro spuštění in-situ nápovědy. */
export function WorldHelpButton({
  onClick,
  label = 'Nápověda',
  className,
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className ? `${s.helpBtn} ${className}` : s.helpBtn}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <HelpCircle size={18} aria-hidden="true" />
    </button>
  );
}
