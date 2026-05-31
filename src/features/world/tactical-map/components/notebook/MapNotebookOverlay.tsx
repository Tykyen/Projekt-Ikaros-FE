/**
 * 10.2j — poznámkový blok na taktické mapě. Plný overlay přes map viewport
 * („otevřená kniha"): ztmavení mapy + velká papírová plocha. Prezentační,
 * řízený přes props — PJ varianta píše do world gm-notes, hráč do notes své
 * postavy (data resolver v `TacticalMapView`).
 *
 * Jádro (papír + autosave + status) sdílí s `WorldGmDiaryPage` přes
 * `useNotebookAutosave` + `NotebookPaper`. Tady navíc backdrop/book chrome.
 */
import { useEffect } from 'react';
import { X } from 'lucide-react';
import {
  NotebookPaper,
  NotebookStatus,
} from '@/features/world/components/notebook/NotebookPaper';
import { useNotebookAutosave } from '@/features/world/components/notebook/useNotebookAutosave';
import s from './MapNotebook.module.css';

interface Props {
  title: string;
  subtitle?: string;
  initialContent: string;
  onSave: (content: string) => Promise<unknown>;
  onClose: () => void;
}

export function MapNotebookOverlay({
  title,
  subtitle,
  initialContent,
  onSave,
  onClose,
}: Props): React.ReactElement {
  const { content, setContent, status, dirty, flush } = useNotebookAutosave(
    initialContent,
    onSave,
  );

  // Zavření: flush nezapsaných změn, pak zavři.
  const handleClose = () => {
    flush();
    onClose();
  };

  // Esc zavře.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, dirty]);

  return (
    <div className={s.backdrop} onClick={handleClose}>
      <div
        className={s.book}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        <header className={s.header}>
          <div className={s.titleWrap}>
            <h2 className={s.title}>{title}</h2>
            {subtitle && <span className={s.subtitle}>{subtitle}</span>}
          </div>
          <div className={s.headerRight}>
            <NotebookStatus status={status} dirty={dirty} />
            <button
              type="button"
              className={s.closeBtn}
              onClick={handleClose}
              aria-label="Zavřít"
            >
              <X size={20} />
            </button>
          </div>
        </header>
        <div className={s.paperScroll}>
          <NotebookPaper value={content} onChange={setContent} />
        </div>
      </div>
    </div>
  );
}
