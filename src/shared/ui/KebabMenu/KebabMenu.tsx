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
  /**
   * 17.10 A5 — alternativa k `anchor`: pozice popoveru přímo z bodu (kurzor
   * při pravém kliku na mapě). Má přednost před `anchor`. Desktop only
   * (mobil = bottom-sheet jako dosud).
   */
  anchorPoint?: { x: number; y: number };
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
  anchorPoint,
  open,
  onClose,
  items,
  ariaLabel = 'Akce',
}: KebabMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [isMobile, setIsMobile] = useState(false);
  // 17.8 — roving tabindex: v tab pořadí je jen `activeIndex` (0), ostatní -1;
  // šipky ↑↓/Home/End přesouvají fokus i „0" mezi menuitem (WAI-ARIA menu).
  const [activeIndex, setActiveIndex] = useState(0);

  // Při otevření zaměř první ne-disabled položku (a zařaď ji do tab pořadí).
  useEffect(() => {
    if (!open) return;
    const first = items.findIndex((it) => !it.disabled);
    const idx = first === -1 ? 0 : first;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- inicializace fokusu při otevření menu (řízeno externím `open`), ne cascading render
    setActiveIndex(idx);
    itemRefs.current[idx]?.focus();
  }, [open, items]);

  const onMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const n = items.length;
    if (n === 0) return;
    const focusAt = (idx: number) => {
      setActiveIndex(idx);
      itemRefs.current[idx]?.focus();
    };
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const dir = e.key === 'ArrowDown' ? 1 : -1;
      let next = activeIndex;
      for (let step = 0; step < n; step++) {
        next = (next + dir + n) % n; // wrap + přeskoč disabled
        if (!items[next]?.disabled) break;
      }
      focusAt(next);
    } else if (e.key === 'Home') {
      e.preventDefault();
      const idx = items.findIndex((it) => !it.disabled);
      if (idx !== -1) focusAt(idx);
    } else if (e.key === 'End') {
      e.preventDefault();
      for (let i = n - 1; i >= 0; i--) {
        if (!items[i]?.disabled) {
          focusAt(i);
          break;
        }
      }
    }
    // Enter/Space řeší nativní <button> aktivace (onClick) — netřeba zvlášť.
  };

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT_PX;
      setIsMobile(mobile);
      if (mobile) {
        setCoords(null);
        return;
      }
      // 17.10 A5 — pozice z bodu (kurzor) má přednost před anchor rectem.
      if (anchorPoint) {
        const left = Math.max(
          8,
          Math.min(anchorPoint.x, window.innerWidth - MENU_WIDTH_PX - 8),
        );
        const top = Math.max(8, Math.min(anchorPoint.y, window.innerHeight - 60));
        setCoords({ top, left });
        return;
      }
      if (!anchor) {
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
    window.addEventListener('scroll', update, { capture: true, passive: true });
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, anchor, anchorPoint]);

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
      {isMobile && (
         
        <div className={s.scrim} onClick={onClose} aria-hidden="true" />
      )}
      <div
        ref={menuRef}
        className={clsx(s.menu, isMobile && s.menuMobile)}
        style={style}
        role="menu"
        tabIndex={-1}
        aria-label={ariaLabel}
        onKeyDown={onMenuKeyDown}
      >
        {items.map((item, i) => (
          <button
            key={item.key}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            role="menuitem"
            tabIndex={i === activeIndex ? 0 : -1}
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
