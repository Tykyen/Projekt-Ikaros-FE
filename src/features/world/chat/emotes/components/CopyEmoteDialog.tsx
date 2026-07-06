import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { WorldRole } from '@/shared/types';
import { parseApiError, parseApiErrorCode } from '@/shared/api/client';
import { useMyWorlds } from '@/features/world/api/useWorlds';
import { useCopyEmote } from '../api/useCopyEmote';
import type { WorldEmote } from '../lib/types';
import s from './CopyEmoteDialog.module.css';

interface CopyEmoteDialogProps {
  sourceWorldId: string;
  emote: WorldEmote;
  onClose: () => void;
}

/** Krok 6.4c — modal výběru cílového světa pro kopírování emote. */
export function CopyEmoteDialog({
  sourceWorldId,
  emote,
  onClose,
}: CopyEmoteDialogProps) {
  const myWorlds = useMyWorlds();
  const copy = useCopyEmote(sourceWorldId);
  const [targetId, setTargetId] = useState<string>('');

  // Eligible cíle: světy kde mám PomocnyPJ+ (BE bude validovat znovu).
  const candidates = useMemo(() => {
    const list = myWorlds.data ?? [];
    return list.filter(
      (w) =>
        w.world.id !== sourceWorldId &&
        w.membership.role >= WorldRole.PomocnyPJ,
    );
  }, [myWorlds.data, sourceWorldId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !copy.isPending) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, copy.isPending]);

  const onSubmit = async () => {
    if (!targetId) return;
    try {
      await copy.mutateAsync({ emoteId: emote.id, targetWorldId: targetId });
      toast.success(`Emote :${emote.shortcode}: zkopírován.`);
      onClose();
    } catch (err: unknown) {
      const code = parseApiErrorCode(err);
      if (code === 'EMOTE_SHORTCODE_TAKEN') {
        toast.error('Shortcode už v cílovém světě existuje.');
      } else if (code === 'EMOTE_LIMIT_REACHED') {
        toast.error(parseApiError(err));
      } else {
        toast.error('Kopírování selhalo.');
      }
    }
  };

  return (
    <div
      className={s.scrim}
      onClick={(e) => {
        if (e.target === e.currentTarget && !copy.isPending) onClose();
      }}
    >
      <div
        className={s.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="copy-emote-title"
      >
        <header className={s.header}>
          <span className={s.ornament}>◆</span>
          <button
            type="button"
            className={s.close}
            onClick={onClose}
            disabled={copy.isPending}
            aria-label="Zavřít"
          >
            <X size={16} />
          </button>
        </header>
        <h2 id="copy-emote-title" className={s.title}>
          Kopírovat <span className={s.shortcode}>:{emote.shortcode}:</span>
        </h2>
        <p className={s.hint}>
          Zvol cílový svět — emote se v něm objeví s tímtéž shortcode.
        </p>

        {candidates.length === 0 ? (
          <p className={s.empty}>
            Nemáš žádný jiný svět s rolí PomocnýPJ+ pro kopírování.
          </p>
        ) : (
          <select
            className={s.select}
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            disabled={copy.isPending}
          >
            <option value="">— vyber svět —</option>
            {candidates.map((c) => (
              <option key={c.world.id} value={c.world.id}>
                {c.world.name}
              </option>
            ))}
          </select>
        )}

        <footer className={s.footer}>
          <button
            type="button"
            className={s.btnGhost}
            onClick={onClose}
            disabled={copy.isPending}
          >
            Zrušit
          </button>
          <button
            type="button"
            className={s.btnPrimary}
            onClick={onSubmit}
            disabled={!targetId || copy.isPending}
          >
            {copy.isPending ? 'Kopíruji…' : 'Kopírovat'}
          </button>
        </footer>
      </div>
    </div>
  );
}
