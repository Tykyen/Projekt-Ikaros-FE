import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { Button } from '@/shared/ui';
import { useAddComment } from '@/features/world/api/useGameEvents';
import s from './CommentComposer.module.css';

interface Props {
  eventId: string;
  /** null/undefined = root comment, string = reply na root. */
  parentId?: string | null;
  /** Volá se po úspěšném odeslání (např. zavřít reply composer). */
  onSubmit?: () => void;
  /** Volá se na Esc nebo Zrušit (reply mode). */
  onCancel?: () => void;
  autoFocus?: boolean;
  /** Reply composer = kompaktnější + cancel button. */
  isReply?: boolean;
}

const MAX = 2000;

export function CommentComposer({
  eventId,
  parentId = null,
  onSubmit,
  onCancel,
  autoFocus = false,
  isReply = false,
}: Props) {
  const [content, setContent] = useState('');
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const add = useAddComment(eventId);

  useEffect(() => {
    if (autoFocus) taRef.current?.focus();
  }, [autoFocus]);

  async function submit() {
    // FEL (styl 38) — Enter volá submit() přímo (obchází disabled tlačítko);
    // bez tohoto guardu 2× Enter během in-flight mutace = 2 komentáře.
    if (add.isPending) return;
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > MAX) return;
    try {
      await add.mutateAsync({ content: trimmed, parentId });
      setContent('');
      onSubmit?.();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          toast.error('Nemáš oprávnění komentovat.');
          return;
        }
        if (status === 404) {
          toast.error('Akce neexistuje.');
          return;
        }
      }
      toast.error('Nepodařilo se odeslat komentář.');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit();
    } else if (e.key === 'Escape' && onCancel) {
      e.preventDefault();
      onCancel();
    }
  }

  const counterVisible = content.length > 1800;
  const tooLong = content.length > MAX;

  return (
    <div className={s.composer} data-reply={isReply ? 'true' : 'false'}>
      <textarea
        ref={taRef}
        className={s.textarea}
        rows={isReply ? 2 : 3}
        placeholder={
          isReply ? 'Napiš odpověď…' : 'Napiš komentář… (Enter = odeslat, Shift+Enter = nový řádek)'
        }
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={MAX + 100 /* nech BE validovat hard limit, FE soft */}
        aria-invalid={tooLong ? 'true' : 'false'}
      />
      <div className={s.actions}>
        {counterVisible && (
          <span className={tooLong ? s.counterError : s.counter}>
            {content.length} / {MAX}
          </span>
        )}
        <div className={s.spacer} />
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={add.isPending}
          >
            Zrušit
          </Button>
        )}
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => void submit()}
          disabled={
            add.isPending || content.trim().length === 0 || tooLong
          }
          loading={add.isPending}
        >
          {isReply ? 'Odpovědět' : 'Odeslat'}
        </Button>
      </div>
    </div>
  );
}
