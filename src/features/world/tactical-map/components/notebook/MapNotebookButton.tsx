/**
 * 10.2j — tlačítko poznámkového bloku na mapě (pod panelem počasí). Pill ve
 * stylu počasí, sépiový accent. Klik → otevře `MapNotebookOverlay`.
 */
import { NotebookPen } from 'lucide-react';
import s from './MapNotebook.module.css';

interface Props {
  onClick: () => void;
  label: string;
}

export function MapNotebookButton({
  onClick,
  label,
}: Props): React.ReactElement {
  return (
    <button
      type="button"
      className={s.pill}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      <NotebookPen className={s.pillIcon} size={17} />
      <span className={s.pillLabel}>{label}</span>
    </button>
  );
}
