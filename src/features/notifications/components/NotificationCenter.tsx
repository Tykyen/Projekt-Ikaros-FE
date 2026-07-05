import { useEffect, useRef } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { useFocusTrap } from '@/shared/ui';
import { usePendingActionsCount } from '@/features/users/api/usePendingActions';
import {
  centerOpenAtom,
  centerTabAtom,
  chatFeedUnseenAtom,
  type NotificationTab,
} from '../model/centerStore';
import { usePush } from '../api/usePush';
import { ChatFeedTab } from './ChatFeedTab';
import { EventsTab } from './EventsTab';
import { PendingTab } from './PendingTab';
import { PushToggle } from './PushToggle';
import { PushDevicesList } from './PushDevicesList';
import s from './NotificationCenter.module.css';

/**
 * Spec 13.2 — notifikační centrum (drawer). Záložky: „Chaty" (souhrn zpráv
 * napříč světy) · „Události" (co mi schválili / přiřazení postavy) · „Ke
 * zpracování" (jen rolím, co mají co schvalovat). Mountuje se jednou
 * v `IkarosLayout`; otevírá zvonek v headeru.
 */
export function NotificationCenter() {
  const [open, setOpen] = useAtom(centerOpenAtom);
  const [tab, setTab] = useAtom(centerTabAtom);
  const setUnseen = useSetAtom(chatFeedUnseenAtom);
  const { data: pending } = usePendingActionsCount();
  const hasPending = (pending?.total ?? 0) > 0;
  // D-030 — jeden zdroj pravdy o push pro přepínač i seznam zařízení.
  const push = usePush();
  // 17.8 — focus trap + navrácení fokusu na zvonek (dřív jen Escape).
  const panelRef = useRef<HTMLElement | null>(null);
  useFocusTrap({ active: open, containerRef: panelRef });

  // Otevření = „viděno" → vynuluj chat badge.
  useEffect(() => {
    if (open) setUnseen(0);
  }, [open, setUnseen]);

  // Když uživatel ztratí schvalovací frontu, neuvízni na skryté záložce.
  useEffect(() => {
    if (tab === 'todo' && !hasPending) setTab('chats');
  }, [tab, hasPending, setTab]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  if (!open) return null;

  const tabs: { id: NotificationTab; label: string }[] = [
    { id: 'chats', label: 'Chaty' },
    { id: 'events', label: 'Události' },
    ...(hasPending
      ? [{ id: 'todo' as NotificationTab, label: 'Ke zpracování' }]
      : []),
  ];

  return (
    <div
      className={s.overlay}
      onClick={() => setOpen(false)}
      role="presentation"
    >
      <aside
        ref={panelRef}
        tabIndex={-1}
        className={s.panel}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Notifikační centrum"
      >
        <header className={s.header}>
          <h2 className={s.title}>Notifikace</h2>
          <button
            type="button"
            className={s.close}
            onClick={() => setOpen(false)}
            aria-label="Zavřít"
          >
            <X size={18} />
          </button>
        </header>

        <nav className={s.tabs} role="tablist" aria-label="Typ notifikací">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`notif-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls="notif-tabpanel"
              className={clsx(s.tab, tab === t.id && s.tabActive)}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div
          className={s.body}
          role="tabpanel"
          id="notif-tabpanel"
          aria-labelledby={`notif-tab-${tab}`}
        >
          {tab === 'chats' && <ChatFeedTab />}
          {tab === 'events' && <EventsTab />}
          {tab === 'todo' && hasPending && <PendingTab />}
        </div>

        <PushDevicesList currentEndpoint={push.currentEndpoint} />
        <PushToggle push={push} />
      </aside>
    </div>
  );
}
