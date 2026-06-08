import { useState } from 'react';
import { toast } from 'sonner';
import { RotateCcw, Trash2 } from 'lucide-react';
import { Button, Spinner, ConfirmDialog } from '@/shared/ui';
import {
  useDeletedWorlds,
  useRestoreWorld,
} from '@/features/world/api/useWorldLifecycle';
import type { World } from '@/shared/types';
import s from './DeletedWorldsTab.module.css';

const DAY_MS = 24 * 60 * 60 * 1000;
const RECOVERY_DAYS = 30;

function daysLeft(deletedAt: string): number {
  const elapsed = Date.now() - new Date(deletedAt).getTime();
  return Math.max(0, RECOVERY_DAYS - Math.floor(elapsed / DAY_MS));
}

/**
 * Admin recovery panel — soft-smazané světy. Admin/Superadmin je může do 30 dní
 * obnovit (`POST /worlds/:id/restore`). Po vypršení je cron trvale smaže.
 */
export function DeletedWorldsTab() {
  const { data: worlds = [], isLoading } = useDeletedWorlds();
  const restore = useRestoreWorld();
  const [toRestore, setToRestore] = useState<World | null>(null);

  if (isLoading) return <Spinner center />;

  if (worlds.length === 0) {
    return (
      <div className={s.empty}>
        <Trash2 size={32} aria-hidden />
        <p>Žádné smazané světy. Vše je v pořádku.</p>
      </div>
    );
  }

  return (
    <div className={s.wrap}>
      <p className={s.intro}>
        Smazané světy čekají na obnovu. Po 30 dnech od smazání se trvale
        odstraní i s daty.
      </p>
      <ul className={s.list}>
        {worlds.map((w) => {
          const left = w.deletedAt ? daysLeft(w.deletedAt) : 0;
          return (
            <li key={w.id} className={s.row}>
              <div className={s.info}>
                <span className={s.name}>{w.name}</span>
                <span className={s.meta}>
                  smazáno{' '}
                  {w.deletedAt
                    ? new Date(w.deletedAt).toLocaleDateString('cs-CZ')
                    : '—'}
                  {' · '}
                  <span className={left <= 5 ? s.urgent : undefined}>
                    zbývá {left} {left === 1 ? 'den' : left < 5 ? 'dny' : 'dní'}
                  </span>
                </span>
              </div>
              <Button
                variant="secondary"
                onClick={() => setToRestore(w)}
                disabled={restore.isPending}
              >
                <RotateCcw size={16} aria-hidden /> Obnovit
              </Button>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={!!toRestore}
        onClose={() => setToRestore(null)}
        title={`Obnovit svět „${toRestore?.name}"?`}
        message="Svět se vrátí do původního stavu i s daty (stránky, postavy, chat). Vlastník k němu zase získá přístup."
        confirmLabel="Obnovit"
        isPending={restore.isPending}
        onConfirm={async () => {
          if (!toRestore) return;
          try {
            await restore.mutateAsync({ worldId: toRestore.id });
            toast.success(`Svět „${toRestore.name}" obnoven.`);
          } catch {
            toast.error('Obnova se nezdařila (možná vypršelo 30denní okno).');
          }
          setToRestore(null);
        }}
      />
    </div>
  );
}
