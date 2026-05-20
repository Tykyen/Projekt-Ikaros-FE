import { useEffect, useRef, useState } from 'react';
import s from './MessageEditInline.module.css';

/**
 * Krok 6.2c — inline editace obsahu zprávy.
 *
 * Discord-like: `MessageItem` swap content → tato textarea. Enter (bez Shift)
 * = uložit, Shift+Enter = nový řádek, Esc = zrušit. Tlačítka `Uložit`/`Zrušit`
 * pod textareou. Pokud se text nezměnil, Uložit jen zavře (ne BE call).
 */

interface Props {
  initialContent: string;
  /** Vrátí true při úspěšném uloženi (mutation hotová). */
  onSave: (content: string) => Promise<void> | void;
  onCancel: () => void;
}

export function MessageEditInline({ initialContent, onSave, onCancel }: Props) {
  const [text, setText] = useState(initialContent);
  const [busy, setBusy] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Focus + caret na konec při mountu.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.focus();
    ta.setSelectionRange(text.length, text.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-grow (max ~8 řádků).
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [text]);

  const save = async () => {
    const t = text.trim();
    if (!t || busy) return;
    if (t === initialContent.trim()) {
      onCancel();
      return;
    }
    setBusy(true);
    try {
      await onSave(t);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={s.wrap}>
      <textarea
        ref={taRef}
        className={s.input}
        value={text}
        rows={1}
        disabled={busy}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void save();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
          }
        }}
        aria-label="Upravit zprávu"
      />
      <div className={s.actions}>
        <button
          type="button"
          className={s.cancel}
          onClick={onCancel}
          disabled={busy}
        >
          Zrušit
        </button>
        <button
          type="button"
          className={s.save}
          onClick={() => void save()}
          disabled={busy || !text.trim()}
        >
          Uložit
        </button>
        <span className={s.hint}>esc zrušit · ↵ uložit</span>
      </div>
    </div>
  );
}
