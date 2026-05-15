import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/shared/ui/Modal/Modal';
import { useRejectArticle } from '../api/useArticles';
import s from './RejectReasonModal.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  articleId: string;
  articleTitle: string;
}

const MIN_REASON = 10;
const MAX_REASON = 2000;

/**
 * 3.2c — modal pro „Vrátit s poznámkou" (reject). Povinný reason min 10
 * znaků (forc reasonable feedback autorovi).
 */
export function RejectReasonModal({
  open,
  onClose,
  articleId,
  articleTitle,
}: Props) {
  const [reason, setReason] = useState('');
  const reject = useRejectArticle();

  function handleClose() {
    setReason('');
    onClose();
  }

  function handleConfirm() {
    const trimmed = reason.trim();
    if (trimmed.length < MIN_REASON) return;
    reject.mutate(
      { id: articleId, reason: trimmed },
      {
        onSuccess: () => {
          toast.success('Článek vrácen autorovi s poznámkou');
          setReason('');
          onClose();
        },
        onError: () => {
          toast.error('Nepodařilo se vrátit článek');
        },
      },
    );
  }

  const trimmedLen = reason.trim().length;
  const isValid = trimmedLen >= MIN_REASON;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Vrátit článek „${articleTitle}"`}
      size="md"
    >
      <p className={s.help}>
        Napiš autorovi, co potřebuje upravit nebo doplnit. Minimální délka{' '}
        {MIN_REASON} znaků.
      </p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Důvod / co opravit…"
        rows={6}
        maxLength={MAX_REASON}
        className={s.textarea}
        autoFocus
      />
      <div className={s.counter}>
        <span className={isValid ? s.counterOk : s.counterShort}>
          {reason.length} / {MAX_REASON}
        </span>
        <span className={s.counterMin}>min {MIN_REASON} znaků</span>
      </div>
      <div className={s.actions}>
        <button
          type="button"
          onClick={handleClose}
          className={s.btnSecondary}
          disabled={reject.isPending}
        >
          Zrušit
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!isValid || reject.isPending}
          className={s.btnPrimary}
        >
          {reject.isPending ? 'Vracím…' : 'Vrátit autorovi'}
        </button>
      </div>
    </Modal>
  );
}
