import { useId, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/shared/ui/Modal/Modal';
import { parseApiError, parseApiErrorCode } from '@/shared/api/client';
import {
  APPEAL_OUTCOME_LABELS,
  MODERATION_ACTION_LABELS,
  useReviewAppeal,
  type AppealOutcome,
  type ModerationAction,
} from '@/shared/moderation';
import type { AppealReviewListItem } from '@/shared/types';
import s from './Appeal.module.css';

const MAX_NOTE = 2000;

interface Props {
  open: boolean;
  onClose: () => void;
  item: AppealReviewListItem;
  onReviewed: () => void;
}

/** Popisky pod radio volbou — co daný výsledek znamená. */
const OUTCOME_HINTS: Record<AppealOutcome, string> = {
  upheld: 'Původní rozhodnutí zůstává v platnosti.',
  overturned: 'Původní rozhodnutí se ruší.',
};

const OUTCOME_ORDER: AppealOutcome[] = ['upheld', 'overturned'];

/**
 * 20B B4 — přezkum odvolání jiným moderátorem. Radio výsledek (potvrdit /
 * zrušit) + povinná poznámka → `POST /moderation/appeals/:id/review`. Vlastní
 * rozhodnutí přezkoumat nelze — BE 403 `APPEAL_SELF_REVIEW_FORBIDDEN`
 * přeložíme na srozumitelnou hlášku (guard je primárně na BE). Montuje se jen
 * když `open`.
 */
export function AppealReviewModal({ open, onClose, item, onReviewed }: Props) {
  const review = useReviewAppeal();
  const uid = useId();

  const [outcome, setOutcome] = useState<AppealOutcome | ''>('');
  const [note, setNote] = useState('');

  const isValid =
    outcome !== '' && note.trim().length > 0 && note.trim().length <= MAX_NOTE;

  const actionLabel =
    MODERATION_ACTION_LABELS[item.action as ModerationAction] ?? item.action;

  function handleSubmit() {
    if (!isValid) return;
    review.mutate(
      {
        appealId: item.appealId,
        input: { outcome, reviewerNote: note.trim() },
      },
      {
        onSuccess: () => {
          toast.success('Odvolání přezkoumáno.');
          onReviewed();
        },
        onError: (err) => {
          toast.error(
            parseApiErrorCode(err) === 'APPEAL_SELF_REVIEW_FORBIDDEN'
              ? 'Toto rozhodnutí jsi vydal ty — přezkoumat ho musí jiný moderátor.'
              : parseApiError(err),
          );
        },
      },
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Přezkoumat odvolání" size="md">
      <form
        className={s.form}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <p className={s.context}>
          Odvolatel <span className={s.contextStrong}>{item.appellantName}</span>{' '}
          se odvolává proti rozhodnutí:{' '}
          <span className={s.contextStrong}>{actionLabel}</span>.
        </p>

        <div className={s.field}>
          <span className={s.fieldLabel}>
            Výsledek přezkumu <span className={s.req}>*</span>
          </span>
          <div className={s.radioGroup} role="radiogroup" aria-label="Výsledek přezkumu">
            {OUTCOME_ORDER.map((o) => (
              <label
                key={o}
                className={
                  outcome === o
                    ? `${s.radioOption} ${s.radioOptionChecked}`
                    : s.radioOption
                }
              >
                <input
                  className={s.radioInput}
                  type="radio"
                  aria-label={APPEAL_OUTCOME_LABELS[o]}
                  name={`${uid}-outcome`}
                  value={o}
                  checked={outcome === o}
                  onChange={() => setOutcome(o)}
                />
                <span className={s.radioText}>
                  <span className={s.radioLabel}>{APPEAL_OUTCOME_LABELS[o]}</span>
                  <span className={s.radioHint}>{OUTCOME_HINTS[o]}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className={s.field}>
          <label className={s.fieldLabel} htmlFor={`${uid}-note`}>
            Poznámka k přezkumu <span className={s.req}>*</span>
          </label>
          <textarea
            id={`${uid}-note`}
            className={s.textarea}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Zdůvodnění výsledku přezkumu (uvidí odvolatel)…"
            rows={4}
            maxLength={MAX_NOTE}
            required
          />
          <span className={s.counter}>
            {note.length} / {MAX_NOTE}
          </span>
        </div>

        <div className={s.actions}>
          <button
            type="button"
            className={s.btnSecondary}
            onClick={onClose}
            disabled={review.isPending}
          >
            Zrušit
          </button>
          <button
            type="submit"
            className={s.btnPrimary}
            disabled={!isValid || review.isPending}
          >
            {review.isPending ? 'Ukládám…' : 'Uložit přezkum'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
