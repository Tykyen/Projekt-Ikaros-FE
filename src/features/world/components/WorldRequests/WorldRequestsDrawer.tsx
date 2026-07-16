import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useFocusTrap } from '@/shared/ui';
import { RequestsList } from './RequestsList';
import type { WorldPendingActionItem } from '@/features/world/api/useWorldPendingActions';
import s from './WorldRequestsDrawer.module.css';

interface Props {
  worldId: string;
  worldSlug: string;
  items: WorldPendingActionItem[];
  onClose: () => void;
}

/**
 * 15.10 — vysunovací panel „ke zpracování" z hlavičky světa. Rychlý přístup
 * k žádostem odkudkoli (mapa/chat) bez opuštění stránky. Side panel zprava
 * (vzor `DayDetailDrawer`) přes portal, ať překryje hlavičku i fullscreen mapu.
 * Sdílí `RequestsList` se stránkou Hráči — žádná duplicita logiky.
 */
export function WorldRequestsDrawer({
  worldId,
  worldSlug,
  items,
  onClose,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap({ active: true, containerRef: ref });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className={s.backdrop} onClick={onClose} role="presentation">
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <aside
        ref={ref}
        className={s.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Ke zpracování"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={s.header}>
          <h2 className={s.title}>Ke zpracování</h2>
          <button
            type="button"
            className={s.closeBtn}
            onClick={onClose}
            aria-label="Zavřít"
            title="Zavřít (ESC)"
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className={s.content}>
          <RequestsList worldId={worldId} worldSlug={worldSlug} items={items} />
        </div>

        <footer className={s.footer}>
          <Link
            to={`/svet/${worldSlug}/hraci`}
            className={s.manageLink}
            onClick={onClose}
          >
            Otevřít správu hráčů →
          </Link>
        </footer>
      </aside>
    </div>,
    document.body,
  );
}
