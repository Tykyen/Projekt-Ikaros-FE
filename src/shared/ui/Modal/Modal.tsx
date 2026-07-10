import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { useFocusTrap } from '../useFocusTrap';
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

  // 17.8 — focus dovnitř + trap + navrácení fokusu (sdílený hook, dřív 2 efekty tady).
  useFocusTrap({ active: open, containerRef: dialogRef });

  if (!open) return null;

  return createPortal(
    // Backdrop klik = myší zkratka pro zavření; klávesová cesta existuje (Esc
    // handler výše + zavírací křížek), proto overlay nemusí být fokusovatelný.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
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
