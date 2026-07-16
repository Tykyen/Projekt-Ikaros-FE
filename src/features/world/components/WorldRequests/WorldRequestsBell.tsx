import { useState } from 'react';
import clsx from 'clsx';
import { Bell } from 'lucide-react';
import { useWorldPendingActions } from '@/features/world/api/useWorldPendingActions';
import { WorldRequestsDrawer } from './WorldRequestsDrawer';
import s from './WorldRequestsBell.module.css';

interface Props {
  worldId: string;
  worldSlug: string;
  className?: string;
}

/**
 * 15.10 — zvoneček „ke zpracování" v hlavičce světa (jen PJ/co-PJ). Badge =
 * počet čekajících podnětů; klik otevře drawer. Rychlý přístup odkudkoli ve
 * světě bez přesměrování. Data sdílí query key se stránkou Hráči (live).
 */
export function WorldRequestsBell({ worldId, worldSlug, className }: Props) {
  const [open, setOpen] = useState(false);
  const { data } = useWorldPendingActions(worldId);
  const count = data?.length ?? 0;

  return (
    <>
      <button
        type="button"
        className={clsx(s.bell, className)}
        onClick={() => setOpen(true)}
        title="Ke zpracování"
        aria-label={
          count > 0 ? `Ke zpracování: ${count} podnětů` : 'Ke zpracování'
        }
      >
        <Bell size={16} aria-hidden="true" />
        {count > 0 && <span className={s.badge}>{count > 99 ? '99+' : count}</span>}
      </button>
      {open && (
        <WorldRequestsDrawer
          worldId={worldId}
          worldSlug={worldSlug}
          items={data ?? []}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
