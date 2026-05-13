import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import s from './KebabMenu.module.css';

export interface KebabMenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  onClick: () => void;
}

interface KebabMenuProps {
  /** Element, ke kterému se popover přiblíží. Pokud null/undefined a `open=true`, popover se ukáže na bottom-sheet pozici (mobile fallback). */
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  items: KebabMenuItem[];
  ariaLabel?: string;
}

const MOBILE_BREAKPOINT_PX = 768;
const MENU_WIDTH_PX = 220;
const MENU_GAP_PX = 6;

/**
 * Sdílený kebab menu primitiv (spec 1.8 §4 Q1=B).
 *
 * Desktop = popover ukotvený k anchoru (pozice počítaná z getBoundingClientRect).
 * Mobile (≤ 768 px) = bottom sheet (fixed dno, full-width).
 *
 * Klik mimo / Escape / scroll okna zavírá menu.
 */
export function KebabMenu({
  anchor,
  open,
  onClose,
  items,
  ariaLabel = 'Akce',
}: KebabMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [isMobile, setIsMobile] = useState(false);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT_PX;
      setIsMobile(mobile);
      if (mobile || !anchor) {
        setCoords(null);
        return;
      }
      const rect = anchor.getBoundingClientRect();
      const viewportW = window.innerWidth;
      const left = Math.max(
        8,
        Math.min(rect.right - MENU_WIDTH_PX, viewportW - MENU_WIDTH_PX - 8),
      );
      const top = rect.bottom + MENU_GAP_PX;
      setCoords({ top, left });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, anchor]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (menuRef.current?.contains(target)) return;
      if (anchor?.contains(target)) return;
      onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, anchor, onClose]);

  if (!open) return null;

  const style =
    !isMobile && coords ? { top: coords.top, left: coords.left } : undefined;

  return createPortal(
    <>
      {isMobile && <div className={s.scrim} onClick={onClose} />}
      <div
        ref={menuRef}
        className={clsx(s.menu, isMobile && s.menuMobile)}
        style={style}
        role="menu"
        aria-label={ariaLabel}
      >
        {items.map((item) => (
          <button
            key={item.key}
            role="menuitem"
            className={clsx(
              s.item,
              item.variant === 'danger' && s.itemDanger,
              item.disabled && s.itemDisabled,
            )}
            disabled={item.disabled}
            onClick={() => {
              item.onClick();
            }}
          >
            {item.icon && <span className={s.icon}>{item.icon}</span>}
            <span className={s.label}>{item.label}</span>
          </button>
        ))}
      </div>
    </>,
    document.body,
  );
}
