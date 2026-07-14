/**
 * 21.3c — platformová osobní knihovna podzemí (`/ikaros/podzemi`).
 *
 * Cross-world úložiště staveb: otevřít v editoru (library režim), kopírovat
 * do světa, smazat. Ukládá se sem ze seznamu podzemí ve světě („Uložit do mé
 * knihovny"). Osobní obsah — bez vazby na Společnou tvorbu (ta je komunitní).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { Globe2, Hammer, Lock, Pencil, Trash2 } from 'lucide-react';
import { ConfirmDialog, Spinner } from '@/shared/ui';
import { currentUserAtom } from '@/shared/store/authStore';
import { isEffectiveSupporter } from '@/shared/lib/supporter';
import {
  useDungeonLibrary,
  useDungeonMapMutations,
} from '../hooks/useDungeonMaps';
import type { DungeonMap } from '../types';
import { DungeonGrid } from './DungeonGrid';
import { WorldPickerModal } from './WorldPickerModal';
import styles from './DungeonListPage.module.css';

export default function DungeonLibraryPage(): React.ReactElement {
  const me = useAtomValue(currentUserAtom);
  const supporter = me ? isEffectiveSupporter(me.role, me.isSupporter) : false;
  const navigate = useNavigate();
  const { data: library, isLoading } = useDungeonLibrary();
  const { removeDungeon, copyDungeon } = useDungeonMapMutations();
  const [deleteTarget, setDeleteTarget] = useState<DungeonMap | null>(null);
  const [pickerSource, setPickerSource] = useState<DungeonMap | null>(null);

  const actionBtn = (
    title: string,
    icon: React.ReactNode,
    onClick: () => void,
  ): React.ReactElement => (
    <button
      type="button"
      className={styles.actionBtn}
      title={title}
      aria-label={title}
      onClick={onClick}
    >
      {icon}
    </button>
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <Hammer size={22} aria-hidden /> Moje knihovna staveb
        </h1>
      </header>

      <p className={styles.libraryHint}>
        Osobní úložiště staveb napříč světy. Nové stavby sem ukládáš ze
        seznamu podzemí ve světě („Uložit do mé knihovny"); odsud je kopíruješ
        do světů, kde stavíš.
      </p>

      {!supporter && (
        <section className={styles.teaser}>
          <Lock size={28} aria-hidden />
          <div>
            <h2>Knihovna je výhoda Podporovatelů</h2>
            <p>
              Ukládat nové stavby a nosit je mezi světy můžou{' '}
              <strong>Podporovatelé</strong> (a PJ své stavby). Co už v knihovně
              máš, zůstává tvoje.
            </p>
          </div>
        </section>
      )}

      {isLoading ? (
        <div className={styles.stateWrap}>
          <Spinner />
        </div>
      ) : (
        <DungeonGrid
          dungeons={[...(library ?? [])].sort((a, b) =>
            (b.lastModified ?? '').localeCompare(a.lastModified ?? ''),
          )}
          emptyText="Knihovna je prázdná. Ve světě otevři Hra → Tvorba podzemí a u stavby klikni „Uložit do mé knihovny“."
          onOpen={(d) => void navigate(`/ikaros/podzemi/${d.id}`)}
          actions={(d) => (
            <>
              {actionBtn('Kopírovat do světa…', <Globe2 size={16} />, () =>
                setPickerSource(d),
              )}
              {actionBtn('Upravit', <Pencil size={16} />, () =>
                void navigate(`/ikaros/podzemi/${d.id}`),
              )}
              {actionBtn('Smazat z knihovny', <Trash2 size={16} />, () =>
                setDeleteTarget(d),
              )}
            </>
          )}
        />
      )}

      <WorldPickerModal
        open={pickerSource !== null}
        title={`Kopírovat „${pickerSource?.name || 'Bez názvu'}“ do světa`}
        confirmLabel="Kopírovat"
        supporter={supporter}
        isPending={copyDungeon.isPending}
        onClose={() => setPickerSource(null)}
        onConfirm={(targetWorldId) => {
          if (!pickerSource) return;
          copyDungeon.mutate(
            { id: pickerSource.id, targetWorldId },
            {
              onSuccess: () => {
                toast.success('Kopie vytvořena v cílovém světě.');
                setPickerSource(null);
              },
              onError: () => toast.error('Kopie se nepovedla.'),
            },
          );
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Smazat z knihovny?"
        message={`„${deleteTarget?.name || 'Bez názvu'}" zmizí z knihovny nenávratně. Kopie ve světech zůstávají.`}
        confirmLabel="Smazat"
        confirmVariant="danger"
        isPending={removeDungeon.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await removeDungeon.mutateAsync(deleteTarget.id).catch(() => {
            toast.error('Smazání se nepovedlo.');
          });
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
