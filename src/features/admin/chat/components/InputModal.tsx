import { useState, useEffect } from 'react';
import { Modal } from '@/shared/ui/Modal/Modal';
import s from './modals.module.css';

/**
 * 20.5 — obecný modal s jedním textovým polem (např. přejmenování dokumentu)
 * jako náhrada za nativní `window.prompt`.
 */
export function InputModal({
  open,
  onClose,
  title,
  label,
  initialValue,
  placeholder,
  confirmLabel = 'Uložit',
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  label?: string;
  initialValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
}) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (open) setValue(initialValue ?? '');
  }, [open, initialValue]);

  const submit = () => {
    const v = value.trim();
    if (!v) return;
    onConfirm(v);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className={s.footer}>
          <button type="button" className={s.btnGhost} onClick={onClose}>
            Zrušit
          </button>
          <button
            type="button"
            className={s.btnPrimary}
            onClick={submit}
            disabled={!value.trim()}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <div className={s.field}>
        {label && <label className={s.label}>{label}</label>}
        <input
          className={s.input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder={placeholder}
          autoFocus
        />
      </div>
    </Modal>
  );
}
