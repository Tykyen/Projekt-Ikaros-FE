import { useState } from 'react';
import { Modal } from '@/shared/ui/Modal/Modal';
import s from './RejectReasonModal.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Nadpis modalu, např. `Vrátit článek „Název"`. */
  title: string;
  /** Probíhá mutace (disabluje tlačítka). */
  isPending: boolean;
  /** Callback s ořezaným důvodem (min 10 znaků zaručeno modalem). */
  onConfirm: (reason: string) => void;
  /** Pomocný text nad textareou. */
  helpText?: string;
  /** Label potvrzovacího tlačítka. */
  confirmLabel?: string;
}

const MIN_REASON = 10;
const MAX_REASON = 2000;

/**
 * 3.2c — modal pro „Vrátit s poznámkou" (reject). Povinný reason min 10 znaků.
 * 3.3b — zobecněn na content-agnostic (`onConfirm` callback) — sdílí ho
 * článkový i galerijní review renderer.
 */
export function RejectReasonModal({
  open,
  onClose,
  title,
  isPending,
  onConfirm,
  helpText,
  confirmLabel = 'Vrátit autorovi',
}: Props) {
  const [reason, setReason] = useState('');

  function handleClose() {
    setReason('');
    onClose();
  }

  function handleConfirm() {
    const trimmed = reason.trim();
    if (trimmed.length < MIN_REASON) return;
    onConfirm(trimmed);
  }

  const trimmedLen = reason.trim().length;
  const isValid = trimmedLen >= MIN_REASON;

  return (
    <Modal open={open} onClose={handleClose} title={title} size="md">
      <p className={s.help}>
        {helpText ??
          'Napiš autorovi, co potřebuje upravit nebo doplnit.'}{' '}
        Minimální délka {MIN_REASON} znaků.
      </p>
      {/* eslint-disable jsx-a11y/no-autofocus -- autofocus na první pole je záměr: modal trapuje fokus, uživatel čeká kurzor v poli důvodu */}
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Důvod / co opravit…"
        rows={6}
        maxLength={MAX_REASON}
        className={s.textarea}
        autoFocus
      />
      {/* eslint-enable jsx-a11y/no-autofocus */}
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
          disabled={isPending}
        >
          Zrušit
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!isValid || isPending}
          className={s.btnPrimary}
        >
          {isPending ? 'Vracím…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
