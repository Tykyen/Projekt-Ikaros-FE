/**
 * 21.3a — seznam podzemí světa (`/svet/:worldSlug/podzemi`).
 *
 * Gating (FE zrcadlí BE): tvořit smí PJ+ vždy a člen Hrac+ s Podporovatelem;
 * hráč vidí jen svoje stavby, PJ všechny. Ne-podporovatel vidí teaser.
 */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { Hammer, Lock, Plus, Trash2 } from 'lucide-react';
import { Button, ConfirmDialog, Input, Modal, Spinner } from '@/shared/ui';
import { currentUserAtom } from '@/shared/store/authStore';
import { isEffectiveSupporter } from '@/shared/lib/supporter';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useDungeonMaps, useDungeonMapMutations } from '../hooks/useDungeonMaps';
import { createEmptyCells } from '../engine/model';
import {
  SIZE_PRESETS,
  generateDungeon,
  randomSeed,
  type SizePresetKey,
} from '../engine/generate';
import type { DungeonMap, DungeonMapInput } from '../types';
import { DUNGEON_LIMITS } from '../types';
import { DungeonThumb } from './DungeonThumb';
import styles from './DungeonListPage.module.css';

export default function DungeonListPage(): React.ReactElement {
  const { worldId, worldSlug, isPJ } = useWorldContext();
  const me = useAtomValue(currentUserAtom);
  const supporter = me ? isEffectiveSupporter(me.role, me.isSupporter) : false;
  const canCreate = isPJ || supporter;

  const navigate = useNavigate();
  const { data: dungeons, isLoading } = useDungeonMaps(worldId || null);
  const { createDungeon, removeDungeon } = useDungeonMapMutations(
    worldId || null,
  );

  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSize, setNewSize] = useState<SizePresetKey>('M');
  const [newMode, setNewMode] = useState<'empty' | 'generated'>('generated');
  const [deleteTarget, setDeleteTarget] = useState<DungeonMap | null>(null);

  const sorted = useMemo(
    () =>
      [...(dungeons ?? [])].sort((a, b) =>
        (b.lastModified ?? '').localeCompare(a.lastModified ?? ''),
      ),
    [dungeons],
  );

  const create = (): void => {
    const preset = SIZE_PRESETS[newSize];
    const base: DungeonMapInput = {
      worldId,
      name: newName.trim() || 'Nové podzemí',
      gridType: 'square',
      gridWidth: preset.width,
      gridHeight: preset.height,
      cellSize: 40,
      theme: 'dyson',
      cells: createEmptyCells(preset.width, preset.height),
      decorations: [],
    };
    if (newMode === 'generated') {
      const g = generateDungeon({
        width: preset.width,
        height: preset.height,
        roomDensity: 0.5,
        windiness: 0.4,
        specialDoorRatio: 0.3,
        seed: randomSeed(),
      });
      base.cells = g.cells;
      base.decorations = g.decorations;
      base.gridWidth = g.cells[0].length;
      base.gridHeight = g.cells.length;
    }
    createDungeon.mutate(base, {
      onSuccess: (created) => {
        setShowNew(false);
        setNewName('');
        void navigate(`/svet/${worldSlug}/podzemi/${created.id}`);
      },
      onError: () =>
        toast.error('Podzemí se nepodařilo založit. Zkus to znovu.'),
    });
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <Hammer size={22} aria-hidden /> Tvorba podzemí
        </h1>
        {canCreate && (
          <Button type="button" onClick={() => setShowNew(true)}>
            <Plus size={16} /> Nové podzemí
          </Button>
        )}
      </header>

      {!canCreate && (
        <section className={styles.teaser}>
          <Lock size={28} aria-hidden />
          <div>
            <h2>Stavěj vlastní jeskyně</h2>
            <p>
              Tvorba podzemí je výhoda <strong>Podporovatelů</strong> — nakresli
              nebo si nech vygenerovat vlastní kobky, vybav je nábytkem
              a vytiskni je jako mapu. Podpoř projekt a stav.
            </p>
          </div>
        </section>
      )}

      {isLoading ? (
        <div className={styles.stateWrap}>
          <Spinner />
        </div>
      ) : sorted.length === 0 ? (
        <div className={styles.stateWrap}>
          <p className={styles.empty}>
            {canCreate
              ? 'Zatím tu žádné podzemí není. Založ první — generátor ti během vteřiny nabídne celou kobku.'
              : isPJ
                ? 'Zatím tu žádné podzemí není.'
                : 'Žádné vlastní stavby. Až budeš Podporovatel, tady porostou.'}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {sorted.map((d) => {
            const mine = !!me && d.ownerId === me.id;
            const canDelete = isPJ || mine;
            return (
              <article key={d.id} className={styles.card}>
                <Link
                  to={`/svet/${worldSlug}/podzemi/${d.id}`}
                  className={styles.thumbLink}
                  aria-label={`Otevřít podzemí ${d.name || 'bez názvu'}`}
                >
                  <DungeonThumb dungeon={d} />
                </Link>
                <div className={styles.cardBody}>
                  <div className={styles.cardText}>
                    <h3 className={styles.cardName}>
                      {d.name || 'Bez názvu'}
                    </h3>
                    <p className={styles.cardMeta}>
                      {d.gridWidth}×{d.gridHeight}
                      {isPJ && d.ownerId && !mine && ' · hráčská stavba'}
                    </p>
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      title="Smazat podzemí"
                      aria-label={`Smazat podzemí ${d.name || 'bez názvu'}`}
                      onClick={() => setDeleteTarget(d)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="Nové podzemí"
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowNew(false)}
            >
              Zrušit
            </Button>
            <Button
              type="button"
              onClick={create}
              loading={createDungeon.isPending}
            >
              Založit
            </Button>
          </>
        }
      >
        <div className={styles.newForm}>
          <label htmlFor="dungeon-name-input">
            Název
            <Input
              id="dungeon-name-input"
              value={newName}
              maxLength={DUNGEON_LIMITS.maxNameLength}
              placeholder="Např. Krysí kanály"
              onChange={(e) => setNewName(e.target.value)}
            />
          </label>
          <label htmlFor="dungeon-size-select">
            Velikost
            <select
              id="dungeon-size-select"
              value={newSize}
              onChange={(e) => setNewSize(e.target.value as SizePresetKey)}
            >
              {(Object.keys(SIZE_PRESETS) as SizePresetKey[]).map((k) => (
                <option key={k} value={k}>
                  {SIZE_PRESETS[k].label}
                </option>
              ))}
            </select>
          </label>
          <fieldset className={styles.modeFieldset}>
            <legend>Začít s</legend>
            <label className={styles.radio}>
              <input
                type="radio"
                name="dungeon-mode"
                checked={newMode === 'generated'}
                onChange={() => setNewMode('generated')}
              />
              Vygenerovaným podzemím (dá se přegenerovat i dokreslit)
            </label>
            <label className={styles.radio}>
              <input
                type="radio"
                name="dungeon-mode"
                checked={newMode === 'empty'}
                onChange={() => setNewMode('empty')}
              />
              Prázdným plátnem (kreslím od nuly)
            </label>
          </fieldset>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Smazat podzemí?"
        message={`„${deleteTarget?.name || 'Bez názvu'}" zmizí nenávratně.`}
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
