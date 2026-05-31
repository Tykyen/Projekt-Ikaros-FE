/**
 * 10.2l — sdílená autosave logika poznámkového bloku (deník PJ na mapě i jako
 * samostatná stránka, poznámky postavy). Debounce 800 ms, status indikátor,
 * flush nezapsaných změn (při zavření). Reuse z `NotesTab` patternu.
 */
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export type NotebookSaveStatus = 'idle' | 'saving' | 'saved';

const AUTOSAVE_DEBOUNCE_MS = 800;

export interface NotebookAutosave {
  content: string;
  setContent: (next: string) => void;
  status: NotebookSaveStatus;
  dirty: boolean;
  /** Okamžitě uloží nezapsané změny (fire-and-forget) — pro zavření overlaye. */
  flush: () => void;
}

export function useNotebookAutosave(
  initialContent: string,
  onSave: (content: string) => Promise<unknown>,
): NotebookAutosave {
  const [content, setContent] = useState(initialContent);
  const [savedContent, setSavedContent] = useState(initialContent);
  const [status, setStatus] = useState<NotebookSaveStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dirty = content !== savedContent;

  const persist = (value: string) => {
    setStatus('saving');
    Promise.resolve(onSave(value))
      .then(() => {
        setSavedContent(value);
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 1500);
      })
      .catch(() => {
        setStatus('idle');
        toast.error('Uložení poznámek selhalo');
      });
  };

  const flush = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (content !== savedContent) persist(content);
  };

  // Auto-save: debounce, pak fire onSave.
  useEffect(() => {
    if (!dirty) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => persist(content), AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, dirty]);

  return { content, setContent, status, dirty, flush };
}
