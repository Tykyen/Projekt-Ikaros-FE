/**
 * 21.3a+c — podzemí světa (`/svet/:worldSlug/podzemi`).
 *
 * Taby: „V tomto světě" (stavby světa) | „Moje knihovna" (osobní cross-world
 * úložiště). Kopie: svět → knihovna, knihovna → tento svět, svět → jiný svět.
 * Gating zrcadlí BE: tvořit smí PJ+ vždy a člen Hrac+ s Podporovatelem.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import {
  ArrowDownToLine,
  BookMarked,
  Globe2,
  Hammer,
  Lock,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button, ConfirmDialog, Input, Modal, Spinner, Tabs } from '@/shared/ui';
import { currentUserAtom } from '@/shared/store/authStore';
import { isEffectiveSupporter } from '@/shared/lib/supporter';
import { useWorldContext } from '@/features/world/context/WorldContext';
import {
  useDungeonLibrary,
  useDungeonMaps,
  useDungeonMapMutations,
} from '../hooks/useDungeonMaps';
import { createEmptyCells } from '../engine/model';
import {
  SIZE_PRESETS,
  generateDungeon,
  randomSeed,
  type SizePresetKey,
} from '../engine/generate';
import { generateCity } from '../engine/generateCity';
import { generateWilderness } from '../engine/generateWilderness';
import type { DungeonMap, DungeonMapInput, MapKind } from '../types';
import { DUNGEON_LIMITS, MAP_KIND_LABELS } from '../types';
import { DungeonGrid } from './DungeonGrid';
import { WorldPickerModal } from './WorldPickerModal';
import styles from './DungeonListPage.module.css';

const sortByModified = (items: DungeonMap[] | undefined): DungeonMap[] =>
  [...(items ?? [])].sort((a, b) =>
    (b.lastModified ?? '').localeCompare(a.lastModified ?? ''),
  );

export default function DungeonListPage(): React.ReactElement {
  const { worldId, worldSlug, isPJ } = useWorldContext();
  const me = useAtomValue(currentUserAtom);
  const supporter = me ? isEffectiveSupporter(me.role, me.isSupporter) : false;
  const canCreate = isPJ || supporter;

  const navigate = useNavigate();
  const [tab, setTab] = useState<'world' | 'library'>('world');
  const { data: dungeons, isLoading } = useDungeonMaps(worldId || null);
  const { data: library, isLoading: libraryLoading } = useDungeonLibrary();
  const { createDungeon, removeDungeon, copyDungeon } =
    useDungeonMapMutations();

  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKind, setNewKind] = useState<MapKind>('dungeon');
  const [newSize, setNewSize] = useState<SizePresetKey>('M');
  const [newMode, setNewMode] = useState<'empty' | 'generated'>('generated');
  const [deleteTarget, setDeleteTarget] = useState<DungeonMap | null>(null);
  const [pickerSource, setPickerSource] = useState<DungeonMap | null>(null);

  const create = (): void => {
    const preset = SIZE_PRESETS[newSize];
    const base: DungeonMapInput = {
      worldId,
      name:
        newName.trim() ||
        (newKind === 'city'
          ? 'Nové město'
          : newKind === 'wilderness'
            ? 'Nová krajina'
            : 'Nové podzemí'),
      mapKind: newKind,
      gridType: 'square',
      gridWidth: preset.width,
      gridHeight: preset.height,
      cellSize: 40,
      theme: 'dyson',
      cells: createEmptyCells(preset.width, preset.height),
      decorations: [],
    };
    if (newMode === 'generated') {
      // 21.3e — engine dle druhu mapy.
      const g =
        newKind === 'city'
          ? generateCity({
              width: preset.width,
              height: preset.height,
              buildingDensity: 0.6,
              windiness: 0.4,
              walls: 'auto',
              river: 'auto',
              greenery: 0.5,
              furnishing: 0.4,
              seed: randomSeed(),
            })
          : newKind === 'wilderness'
            ? generateWilderness({
                width: preset.width,
                height: preset.height,
                forestness: 0.6,
                mountainness: 0.4,
                water: 'auto',
                settlement: 'auto',
                furnishing: 0.5,
                seed: randomSeed(),
              })
            : generateDungeon({
                width: preset.width,
                height: preset.height,
                roomDensity: 0.5,
                windiness: 0.4,
                specialDoorRatio: 0.3,
                furnishing: 0.4,
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

  const saveToLibrary = (d: DungeonMap): void => {
    copyDungeon.mutate(
      { id: d.id },
      {
        onSuccess: () =>
          toast.success(`„${d.name || 'Bez názvu'}" uloženo do tvé knihovny.`),
        onError: () =>
          toast.error(
            'Do knihovny se to nepovedlo uložit — knihovna je výhoda Podporovatelů (a PJ).',
          ),
      },
    );
  };

  const insertHere = (d: DungeonMap): void => {
    copyDungeon.mutate(
      { id: d.id, targetWorldId: worldId },
      {
        onSuccess: (created) => {
          toast.success('Vloženo do tohoto světa.');
          setTab('world');
          void navigate(`/svet/${worldSlug}/podzemi/${created.id}`);
        },
        onError: () => toast.error('Vložení do světa se nepovedlo.'),
      },
    );
  };

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

  const worldTab = isLoading ? (
    <div className={styles.stateWrap}>
      <Spinner />
    </div>
  ) : (
    <DungeonGrid
      dungeons={sortByModified(dungeons)}
      emptyText={
        canCreate
          ? 'Zatím tu žádné podzemí není. Založ první — generátor ti během vteřiny nabídne celou kobku.'
          : isPJ
            ? 'Zatím tu žádné podzemí není.'
            : 'Žádné vlastní stavby. Až budeš Podporovatel, tady porostou.'
      }
      onOpen={(d) => void navigate(`/svet/${worldSlug}/podzemi/${d.id}`)}
      meta={(d) => (isPJ && d.ownerId && me && d.ownerId !== me.id ? 'hráčská stavba' : null)}
      actions={(d) => {
        const mine = !!me && d.ownerId === me.id;
        const canManage = isPJ || mine;
        return (
          <>
            {canManage &&
              actionBtn('Uložit do mé knihovny', <BookMarked size={16} />, () =>
                saveToLibrary(d),
              )}
            {canManage &&
              actionBtn('Kopírovat do světa…', <Globe2 size={16} />, () =>
                setPickerSource(d),
              )}
            {canManage &&
              actionBtn('Smazat podzemí', <Trash2 size={16} />, () =>
                setDeleteTarget(d),
              )}
          </>
        );
      }}
    />
  );

  const libraryTab = libraryLoading ? (
    <div className={styles.stateWrap}>
      <Spinner />
    </div>
  ) : (
    <>
      <p className={styles.libraryHint}>
        Knihovna je tvoje osobní a jde s tebou napříč světy. Úpravy v ní
        neovlivní kopie ve světech (a naopak).
      </p>
      <DungeonGrid
        dungeons={sortByModified(library)}
        emptyText="Knihovna je prázdná. U stavby ve světě klikni na záložku „Uložit do mé knihovny“."
        onOpen={(d) => void navigate(`/ikaros/podzemi/${d.id}`)}
        actions={(d) => (
          <>
            {canCreate &&
              actionBtn(
                'Vložit do tohoto světa',
                <ArrowDownToLine size={16} />,
                () => insertHere(d),
              )}
            {actionBtn('Upravit v knihovně', <Pencil size={16} />, () =>
              void navigate(`/ikaros/podzemi/${d.id}`),
            )}
            {actionBtn('Smazat z knihovny', <Trash2 size={16} />, () =>
              setDeleteTarget(d),
            )}
          </>
        )}
      />
    </>
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <Hammer size={22} aria-hidden /> Stavitel
        </h1>
        {canCreate && (
          <Button type="button" onClick={() => setShowNew(true)}>
            <Plus size={16} /> Nová mapa
          </Button>
        )}
      </header>

      {!canCreate && (
        <section className={styles.teaser}>
          <Lock size={28} aria-hidden />
          <div>
            <h2>Stavěj vlastní jeskyně i města</h2>
            <p>
              Stavitel je výhoda <strong>Podporovatelů</strong> — nakresli nebo
              si nech vygenerovat kobky i celá městečka, vybav je, ulož si je
              do osobní knihovny a nos je mezi světy. Podpoř projekt a stav.
            </p>
          </div>
        </section>
      )}

      <Tabs
        orientation="horizontal"
        items={[
          { id: 'world', label: 'V tomto světě' },
          { id: 'library', label: 'Moje knihovna' },
        ]}
        activeId={tab}
        onChange={(id) => setTab(id as 'world' | 'library')}
      >
        {tab === 'world' ? worldTab : libraryTab}
      </Tabs>

      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="Nová mapa"
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
          <fieldset className={styles.modeFieldset}>
            <legend>Druh mapy</legend>
            <div className={styles.kindRow}>
              {(['dungeon', 'city', 'wilderness'] as const).map((k) => (
                <label
                  key={k}
                  className={`${styles.kindOption} ${newKind === k ? styles.kindActive : ''}`}
                >
                  <input
                    type="radio"
                    name="dungeon-kind"
                    checked={newKind === k}
                    onChange={() => setNewKind(k)}
                  />
                  {k === 'dungeon' ? '🕳️' : k === 'city' ? '🏘️' : '🌲'}{' '}
                  {MAP_KIND_LABELS[k]}
                </label>
              ))}
            </div>
          </fieldset>
          <label htmlFor="dungeon-name-input">
            Název
            <Input
              id="dungeon-name-input"
              value={newName}
              maxLength={DUNGEON_LIMITS.maxNameLength}
              placeholder={
                newKind === 'city'
                  ? 'Např. Vraní Lhota'
                  : newKind === 'wilderness'
                    ? 'Např. Mlžné vrchy'
                    : 'Např. Krysí kanály'
              }
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
              {newKind === 'city'
                ? 'Vygenerovaným městem (dá se přegenerovat i dokreslit)'
                : newKind === 'wilderness'
                  ? 'Vygenerovanou krajinou (dá se přegenerovat i dokreslit)'
                  : 'Vygenerovaným podzemím (dá se přegenerovat i dokreslit)'}
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

      <WorldPickerModal
        open={pickerSource !== null}
        title={`Kopírovat „${pickerSource?.name || 'Bez názvu'}“ do světa`}
        confirmLabel="Kopírovat"
        supporter={supporter}
        excludeWorldId={worldId}
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
