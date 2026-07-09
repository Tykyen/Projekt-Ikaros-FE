import { useId, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/shared/ui/Modal/Modal';
import { parseApiError, parseApiErrorCode } from '@/shared/api/client';
import { useSubmitAppeal } from '@/shared/moderation';
import s from './Appeal.module.css';

const MAX_REASON = 2000;

interface Props {
  open: boolean;
  onClose: () => void;
  decisionId: string;
  /** Lidský popis původní akce — kontext pro odvolatele. */
  actionLabel: string;
  /** Zavolá se po úspěšném podání (list se refetchne přes hook). */
  onSubmitted: () => void;
}

/**
 * 20B B4 — autor postiženého obsahu se odvolá proti moderačnímu rozhodnutí.
 * Malý modal s povinným důvodem odvolání → `POST /moderation/decisions/:id/
 * appeal`. Jedno odvolání na rozhodnutí — BE 409 `APPEAL_ALREADY_EXISTS`
 * přeložíme na srozumitelnou hlášku.
 */
export function AppealModal({
  open,
  onClose,
  decisionId,
  actionLabel,
  onSubmitted,
}: Props) {
  const submit = useSubmitAppeal();
  const uid = useId();
  const [reason, setReason] = useState('');

  const isValid =
    reason.trim().length > 0 && reason.trim().length <= MAX_REASON;

  function handleSubmit() {
    if (!isValid) return;
    submit.mutate(
      { decisionId, input: { reason: reason.trim() } },
      {
        onSuccess: () => {
          toast.success('Odvolání podáno, čeká na přezkum.');
          onSubmitted();
        },
        onError: (err) => {
          toast.error(
            parseApiErrorCode(err) === 'APPEAL_ALREADY_EXISTS'
              ? 'Proti tomuto rozhodnutí už jsi se jednou odvolal.'
              : parseApiError(err),
          );
        },
      },
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Odvolat se proti rozhodnutí" size="md">
      <form
        className={s.form}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <p className={s.context}>
          Odvoláváš se proti rozhodnutí:{' '}
          <span className={s.contextStrong}>{actionLabel}</span>. Odvolání
          přezkoumá jiný moderátor.
        </p>

        <div className={s.field}>
          <label className={s.fieldLabel} htmlFor={`${uid}-reason`}>
            Důvod odvolání <span className={s.req}>*</span>
          </label>
          <textarea
            id={`${uid}-reason`}
            className={s.textarea}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Vysvětli, proč s rozhodnutím nesouhlasíš…"
            rows={5}
            maxLength={MAX_REASON}
            required
          />
          <span className={s.counter}>
            {reason.length} / {MAX_REASON}
          </span>
        </div>

        <div className={s.actions}>
          <button
            type="button"
            className={s.btnSecondary}
            onClick={onClose}
            disabled={submit.isPending}
          >
            Zrušit
          </button>
          <button
            type="submit"
            className={s.btnPrimary}
            disabled={!isValid || submit.isPending}
          >
            {submit.isPending ? 'Odesílám…' : 'Podat odvolání'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
