/**
 * 10.2l — papírová plocha poznámkového bloku (vintage linkovaný papír,
 * handwriting font). Sdílí ji overlay na mapě i samostatná stránka deníku PJ.
 * Vizuál navazuje na `NotesTab` (theme-agnostic — zápisník má vlastní estetiku
 * nad world themem).
 */
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import type { NotebookSaveStatus } from './useNotebookAutosave';
import s from './notebook.module.css';

export function NotebookPaper({
  value,
  onChange,
  placeholder = 'Klikni a začni psát…',
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}): React.ReactElement {
  return (
    <div className={s.paper}>
      <RichTextEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}

export function NotebookStatus({
  status,
  dirty,
}: {
  status: NotebookSaveStatus;
  dirty: boolean;
}): React.ReactElement | null {
  if (status === 'saving') return <span className={s.status}>Ukládám…</span>;
  if (status === 'saved')
    return <span className={`${s.status} ${s.statusSaved}`}>Uloženo ✓</span>;
  if (dirty) return <span className={s.status}>Nezapsáno…</span>;
  return null;
}
