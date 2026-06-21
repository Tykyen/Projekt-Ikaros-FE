import clsx from 'clsx';
import { Lock, ShieldCheck } from 'lucide-react';
import { useElevateWorld, useDeElevateWorld } from '../api/useWorldElevation';
import s from './AdminElevationToggle.module.css';

interface Props {
  worldId: string;
  /** Má admin v tomto světě „nahozené" pravomoci? */
  elevated: boolean;
}

/**
 * Elevation toggle („nahození práv") — platform admin si zapne/vypne admin
 * pravomoci v daném světě. Viditelný jen pro platform adminy (rozhoduje volající
 * WorldLayout). De-elevated = admin se chová jako hráč; elevated = plná moc.
 * Spec: docs/arch/phase-1/_side-tasks/spec-world-admin-elevation.md.
 */
export function AdminElevationToggle({ worldId, elevated }: Props) {
  const elevate = useElevateWorld();
  const deElevate = useDeElevateWorld();
  const busy = elevate.isPending || deElevate.isPending;

  const onClick = () => {
    if (busy) return;
    if (elevated) {
      deElevate.mutate(worldId);
    } else {
      if (
        !window.confirm(
          'Aktivovat admin pravomoci v tomto světě? Získáš plná práva PJ až do složení.',
        )
      )
        return;
      elevate.mutate(worldId);
    }
  };

  return (
    <button
      type="button"
      className={clsx(s.toggle, elevated && s.elevated)}
      onClick={onClick}
      disabled={busy}
      aria-pressed={elevated}
      title={
        elevated
          ? 'Admin režim aktivní — klikni pro složení pravomocí'
          : 'Aktivovat admin pravomoci v tomto světě'
      }
    >
      {elevated ? <ShieldCheck size={14} /> : <Lock size={14} />}
      <span className={s.label}>
        {elevated ? 'Admin režim' : 'Aktivovat admina'}
      </span>
    </button>
  );
}
