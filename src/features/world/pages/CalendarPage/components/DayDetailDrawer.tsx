import { useEffect, useRef } from 'react';
import { X, CalendarRange, User, Users, MapPin } from 'lucide-react';
import { formatFantasyDate, type CalendarConfig, type FantasyDate } from '@/shared/lib/calendarEngine';
import { useFocusTrap } from '../hooks/useFocusTrap';
import s from './DayDetailDrawer.module.css';

/** Minimální tvar UnifiedEvent který drawer potřebuje. */
export interface DrawerEvent {
  id: string;
  title: string;
  date: FantasyDate;
  endDate?: FantasyDate;
  color: string;
  kind: 'gameEvent' | 'player' | 'npc' | 'location';
  entityName?: string;
}

interface Props {
  day: FantasyDate;
  events: DrawerEvent[];
  config: CalendarConfig;
  onClose: () => void;
  onEventClick: (eventId: string) => void;
}

const KIND_PRIORITY: Record<DrawerEvent['kind'], number> = {
  gameEvent: 0,
  player: 1,
  npc: 2,
  location: 3,
};

const KIND_LABEL: Record<DrawerEvent['kind'], string> = {
  gameEvent: 'Akce světa',
  player: 'Hráč',
  npc: 'NPC',
  location: 'Lokace',
};

const KIND_ICON: Record<DrawerEvent['kind'], React.ReactNode> = {
  gameEvent: <CalendarRange size={14} />,
  player: <User size={14} />,
  npc: <Users size={14} />,
  location: <MapPin size={14} />,
};

/**
 * 9.4 — Day detail drawer. Side panel zprava s plným seznamem eventů dne,
 * sortable (akce světa → typ → čas → název entity), drží grid v pozadí.
 *
 * Focus trap + ESC close + click outside close. Reuse `<Modal>` pattern by
 * neudělal protože chceme grid viditelný za drawerem.
 */
export function DayDetailDrawer({
  day,
  events,
  config,
  onClose,
  onEventClick,
}: Props) {
  const drawerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(drawerRef, true);

  // ESC close.
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

  // Sort: priorita (gameEvent first) → time → entity name → title.
  const sorted = [...events].sort((a, b) => {
    const p = KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind];
    if (p !== 0) return p;
    const ha = a.date.hour ?? -1;
    const hb = b.date.hour ?? -1;
    if (ha !== hb) return ha - hb;
    const ma = a.date.minute ?? 0;
    const mb = b.date.minute ?? 0;
    if (ma !== mb) return ma - mb;
    const na = (a.entityName ?? '').localeCompare(b.entityName ?? '', 'cs');
    if (na !== 0) return na;
    return a.title.localeCompare(b.title, 'cs');
  });

  function formatTime(d: FantasyDate): string {
    if (d.hour === undefined || d.hour === null) return '';
    const h = String(d.hour).padStart(2, '0');
    const m = String(d.minute ?? 0).padStart(2, '0');
    return `${h}:${m}`;
  }

  return (
    <div className={s.backdrop} onClick={onClose} role="presentation">
      <aside
        ref={drawerRef}
        className={s.drawer}
        role="dialog"
        aria-modal="true"
        aria-label={`Detail dne ${formatFantasyDate(day, config)}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={s.header}>
          <div className={s.titleRow}>
            <h2 className={s.title}>{formatFantasyDate(day, config)}</h2>
          </div>
          <button
            type="button"
            className={s.closeBtn}
            onClick={onClose}
            aria-label="Zavřít detail dne"
            title="Zavřít (ESC)"
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <p className={s.count}>
          {sorted.length === 1
            ? '1 událost'
            : sorted.length < 5
              ? `${sorted.length} události`
              : `${sorted.length} událostí`}
        </p>

        <ul className={s.list}>
          {sorted.map((ev) => {
            const time = formatTime(ev.date);
            return (
              <li key={ev.id} className={s.row}>
                <button
                  type="button"
                  className={s.eventBtn}
                  onClick={() => onEventClick(ev.id)}
                >
                  <span
                    className={s.colorBar}
                    style={{ background: ev.color }}
                    aria-hidden
                  />
                  <span className={s.eventBody}>
                    <span className={s.eventTopRow}>
                      {time && <span className={s.time}>{time}</span>}
                      <span className={s.evTitle}>{ev.title}</span>
                    </span>
                    <span className={s.kind}>
                      {KIND_ICON[ev.kind]} {KIND_LABEL[ev.kind]}
                      {ev.entityName && ev.kind !== 'gameEvent' && (
                        <> · {ev.entityName}</>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}
