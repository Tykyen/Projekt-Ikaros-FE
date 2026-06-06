import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import s from './Modal.module.css';

type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: Size;
  footer?: ReactNode;
  children: ReactNode;
  /** Pokud false, klik na backdrop nezavře modal. Default: true. */
  closeOnBackdrop?: boolean;
  /** ARIA label pokud nemá title (např. modal s vlastním nadpisem v body). */
  ariaLabel?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  footer,
  children,
  closeOnBackdrop = true,
  ariaLabel,
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Zavřít na Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Zamknout scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Focus management — uložit předchozí focus, focus dovnitř, navrátit při zavření
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    // Focus dovnitř modalu — preferujeme form fields (input/select/textarea),
    // jinak první focusable, jinak samotný dialog. Důvod: form-modaly chceme
    // mít zaměřené přímo v poli, ne na "×" tlačítku.
    const dialog = dialogRef.current;
    if (dialog) {
      const formField = dialog.querySelector<HTMLElement>(
        'input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
      );
      const focusables = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      const target = formField ?? focusables[0] ?? dialog;
      target.focus();
    }

    return () => {
      previousFocusRef.current?.focus?.();
    };
  }, [open]);

  // Focus trap — Tab/Shift+Tab uvnitř modalu cykluje
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => !el.hasAttribute('disabled'));
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className={s.overlay}
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={clsx(s.dialog, s[size])}
        role="dialog"
        aria-modal
        aria-labelledby={title ? titleId : undefined}
        aria-label={!title ? ariaLabel : undefined}
        tabIndex={-1}
      >
        {title && (
          <div className={s.header}>
            <span id={titleId} className={s.title}>{title}</span>
            <button className={s.close} onClick={onClose} aria-label="Zavřít">
              ×
            </button>
          </div>
        )}
        <div className={s.body}>{children}</div>
        {footer && <div className={s.footer}>{footer}</div>}
      </div>
    </div>,
    // Když je aktivní nativní fullscreen (např. taktická mapa), prohlížeč
    // vykresluje jen fullscreen element a jeho potomky — portal do document.body
    // by byl neviditelný. Proto míříme do fullscreen elementu, jinak do body.
    document.fullscreenElement ?? document.body,
  );
}
