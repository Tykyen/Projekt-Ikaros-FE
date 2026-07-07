/**
 * 10.2c — PJ orchestrator panel.
 *
 * Floating sbalitelný panel right-side viewport pro PJ. Sekce:
 *   1. **Aktivní scény** — klik = switch self (`member.assignToScene` self-call)
 *   2. **Rozmístění hráčů** — per-user dropdown
 *
 * Vykresluje se jen pro PJ (`>= PomocnyPJ`). Logika branching v parent
 * (`TacticalMapView`).
 *
 * Spec: docs/arch/phase-10/spec-10.2c.md §2 (PJ orchestrator), §5.
 */
import { useCallback, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useActiveScenes } from '../../hooks/useActiveScenes';
import { mapSceneQueryKey } from '../../hooks/useMapScene';
import { api, apiClient, parseApiError } from '@/shared/api/client';
import { ConfirmDialog } from '@/shared/ui';
import { postWorldOperation } from '../../api/worldOpsApi';
import { postMapOperation } from '../../api/mapApi';
import { activeScenesQueryKey } from '../../hooks/useActiveScenes';
import { ActiveScenesList } from './ActiveScenesList';
import { PaletteAccordion } from './PaletteAccordion';
import { BestiePalette } from './BestiePalette';
import { PcPalette } from './PcPalette';
import { NpcCharacterPalette } from './NpcCharacterPalette';
import { EditSceneModal } from './EditSceneModal';
import { MapLibraryModal } from './MapLibraryModal';
import { LoadPreparationDialog } from './LoadPreparationDialog';
import { ClearSceneDialog } from './ClearSceneDialog';
import { useImportUvttScene } from '../../import/useImportUvttScene';
import { UvttParseError } from '../../import/parseUvtt';
import { useResolvedSystemId } from '@/features/world/useResolvedSystemId';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { WorldRole } from '@/shared/types';
import type { SpawnPayload } from '../../utils/spawnPayload';
import type { MapScene, WorldOperation } from '../../types';
import styles from './MapPjPanel.module.css';

interface Props {
  worldId: string;
  /** Aktuálně focused scéna (`useMapScene` z TacticalMapView). */
  currentScene: MapScene | null;
  /** Current user ID (z auth atom). Pro self-assign. */
  currentUserId: string;
  /**
   * 10.2c-edit-9a — propagace start placement mode z palet do `TacticalMapView`,
   * kde se zachytává klik na hex a provádí `token.add`.
   */
  onStartPlacement: (payload: SpawnPayload, multi: boolean) => void;
  /** 17.10 A2 — minimalizace panelu do spodní lišty (parent řídí mount). */
  onMinimize?: () => void;
}

const PJ_PANEL_OPEN_KEY = 'ikr-map-pj-panel-open';

export function MapPjPanel({
  worldId,
  currentScene,
  currentUserId,
  onStartPlacement,
  onMinimize,
}: Props): React.ReactElement {
  // 10.2j — persistované sbalení (default zavřeno po refreshi, stejně jako log
  // hodů). Otevřeno jen pokud uživatel explicitně rozbalil (uloženo "1").
  const [expanded, setExpanded] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PJ_PANEL_OPEN_KEY) === '1';
    } catch {
      return false;
    }
  });
  const toggleExpanded = (): void => {
    setExpanded((v) => {
      const next = !v;
      try {
        localStorage.setItem(PJ_PANEL_OPEN_KEY, next ? '1' : '0');
      } catch {
        /* private mode — collapse je čistě UI, ignoruj */
      }
      return next;
    });
  };
  const [editingScene, setEditingScene] = useState<MapScene | null>(null);
  // 10.2o — která paleta je rozevřená do boku (flyout). Jen jedna naráz.
  const [openFlyout, setOpenFlyout] = useState<'pc' | 'npc' | 'bestie' | null>(
    null,
  );
  const toggleFlyout = useCallback(
    (key: 'pc' | 'npc' | 'bestie') =>
      setOpenFlyout((cur) => (cur === key ? null : key)),
    [],
  );
  const [showLibrary, setShowLibrary] = useState(false);
  const [showLoadPrep, setShowLoadPrep] = useState(false);
  /**
   * 10.2c-edit-1 — sceneId pro pending deactivate confirm dialog. null =
   * dialog zavřený. Po confirm → spustí deactivateMutation → set zpět null.
   */
  const [pendingDeactivateId, setPendingDeactivateId] = useState<string | null>(
    null,
  );
  /**
   * 10.2c-edit-7 — scéna v pending stavu pro „Vyčistit". null = dialog zavřený.
   */
  const [pendingClearScene, setPendingClearScene] = useState<MapScene | null>(
    null,
  );
  // 10.2n — počty aktivních entit v hlavičkách sbalitelných palet.
  const [paletteCounts, setPaletteCounts] = useState({
    pc: 0,
    npc: 0,
    bestie: 0,
  });
  const setPcCount = useCallback(
    (n: number) =>
      setPaletteCounts((c) => (c.pc === n ? c : { ...c, pc: n })),
    [],
  );
  const setNpcCount = useCallback(
    (n: number) =>
      setPaletteCounts((c) => (c.npc === n ? c : { ...c, npc: n })),
    [],
  );
  const setBestieCount = useCallback(
    (n: number) =>
      setPaletteCounts((c) => (c.bestie === n ? c : { ...c, bestie: n })),
    [],
  );
  const queryClient = useQueryClient();
  const { scenes: activeScenes } = useActiveScenes(worldId, expanded);
  const { userRole, world } = useWorldContext();
  const systemId = useResolvedSystemId() || null;
  // R-17 — tvorba/aktivace/mazání scény je na BE PJ(5) (`maps.assertCanManage`).
  // Panel se zobrazuje PomocnyPJ+, ale scene-create akce gatujeme na PJ, ať
  // PomocnyPJ nevidí tlačítka, co skončí 403. (Přiřazení/edit scény = PomocnyPJ.)
  // N-16 / R-AUDIT + elevation — mirror TacticalMapView.isPJ: owner-bypass +
  // world.elevated, ne jen holá world role.
  const isElevatedHere = world?.elevated === true;
  const isPjStrict =
    world?.ownerId === currentUserId ||
    isElevatedHere ||
    (userRole ?? -1) >= WorldRole.PJ;

  const mutation = useMutation({
    mutationFn: (op: WorldOperation) => postWorldOperation(worldId, op),
    onSuccess: () => {
      // Invalidate members (refresh currentSceneId-y) + mou scénu (pokud se self switch)
      void queryClient.invalidateQueries({ queryKey: ['worlds', worldId, 'members'] });
      void queryClient.invalidateQueries({ queryKey: mapSceneQueryKey(worldId) });
      // C-25 — PJ list aktivních scén (REST fallback k WS).
      void queryClient.invalidateQueries({ queryKey: activeScenesQueryKey(worldId) });
    },
    onError: (err) => {
      toast.error(`Přepnutí scény selhalo: ${parseApiError(err)}`);
    },
  });

  const handleSwitchSelf = (sceneId: string): void => {
    mutation.mutate({
      type: 'member.assignToScene',
      userId: currentUserId,
      sceneId,
    });
  };

  // 10.2c-edit-1 — scene.deactivate (per-scene op). BE atomic CAS isActive=false +
  // cascade unassign affected hráčů (privát map:reassigned event → empty state).
  const deactivateMutation = useMutation({
    mutationFn: (sceneId: string) =>
      postMapOperation(sceneId, { type: 'scene.deactivate' }),
    onSuccess: () => {
      // Refresh aktivních scén (BE setlo isActive=false → mizí z listu)
      void queryClient.invalidateQueries({
        queryKey: activeScenesQueryKey(worldId),
      });
      // Refresh membership tabulky (affected unassigned)
      void queryClient.invalidateQueries({
        queryKey: ['worlds', worldId, 'members'],
      });
      // Pokud byla deaktivovaná moje scéna, BE už emitnul map:reassigned →
      // useReassignmentListener invaliduje sám. Tady defenzivně invalidujeme
      // i mapSceneQueryKey pokud current PJ na scéně byl.
      void queryClient.invalidateQueries({ queryKey: mapSceneQueryKey(worldId) });
      setPendingDeactivateId(null);
    },
    onError: (err) => {
      toast.error(`Deaktivace scény selhala: ${parseApiError(err)}`);
      setPendingDeactivateId(null);
    },
  });

  // 10.2c hotfix — "Nová scéna" mutation (extracted z MapEmptyState).
  // Vytvoří scénu, aktivuje, auto-assign self.
  const createSceneMutation = useMutation({
    mutationFn: async (): Promise<{ id: string }> => {
      const scene = await api.post<{ id: string; name: string; worldId: string }>(
        '/maps',
        {
          worldId,
          name: 'Nová scéna',
          config: { size: 40, originX: 0, originY: 0, showGrid: true },
        },
      );
      await apiClient.post(`/maps/${scene.id}/active`, undefined, {
        params: { worldId },
      });
      await postWorldOperation(worldId, {
        type: 'member.assignToScene',
        userId: currentUserId,
        sceneId: scene.id,
      });
      return scene;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mapSceneQueryKey(worldId) });
      void queryClient.invalidateQueries({
        queryKey: ['worlds', worldId, 'members'],
      });
      // C-26 — byl tu dead key ['map','world-scenes',…,'active']; správný factory.
      void queryClient.invalidateQueries({
        queryKey: activeScenesQueryKey(worldId),
      });
    },
  });

  // 17.2 — import hotové mapy z UVTT/.dd2vtt souboru.
  const importUvtt = useImportUvttScene(worldId, currentUserId);
  const uvttInputRef = useRef<HTMLInputElement>(null);
  const handleUvttFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    e.target.value = ''; // umožní vybrat stejný soubor znovu
    if (file) importUvtt.mutate(file);
  };
  const importErrorMessage = importUvtt.error
    ? importUvtt.error instanceof UvttParseError
      ? importUvtt.error.message
      : 'Import mapy selhal — zkontroluj, že jde o platný UVTT/.dd2vtt soubor.'
    : null;

  return (
    <aside className={styles.panel}>
      <header
        className={styles.header}
        onClick={toggleExpanded}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpanded();
          }
        }}
      >
        <span className={styles.title}>⚙ Orchestrace</span>
        {onMinimize && (
          <button
            type="button"
            className={styles.minBtn}
            aria-label="Zmenšit do lišty"
            title="Zmenšit do lišty"
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
          >
            —
          </button>
        )}
        <span className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}>
          ▾
        </span>
      </header>

      {expanded && (
        <div className={styles.body}>
          {/* 10.2n — i „Aktivní scény" sbalitelné (vše default zavřené).
              Akce Knihovna / + Nová jsou uvnitř těla accordionu. */}
          <PaletteAccordion
            id="scenes"
            title="Aktivní scény"
            count={activeScenes.length}
          >
            {/* R-17 — scene-create akce = BE PJ(5); PomocnyPJ je nevidí. */}
            {isPjStrict && (
              <div className={styles.sceneActions}>
                <button
                  type="button"
                  className={styles.newSceneBtn}
                  onClick={() => setShowLibrary(true)}
                  title="Otevřít knihovnu map (uložit / načíst šablonu)"
                >
                  📚 Knihovna
                </button>
                <button
                  type="button"
                  className={styles.newSceneBtn}
                  onClick={() => createSceneMutation.mutate()}
                  disabled={createSceneMutation.isPending}
                  title="Vytvoří novou scénu, aktivuje ji a přiřadí tě na ni"
                >
                  {createSceneMutation.isPending ? '…' : '+ Nová'}
                </button>
                <button
                  type="button"
                  className={styles.newSceneBtn}
                  onClick={() => setShowLoadPrep(true)}
                  title="Vytvoří novou scénu ze scénáře (Storyboard): podklad mapy + připravené postavy a bestie"
                >
                  🎬 Načíst přípravu
                </button>
                {/* 17.2 — import hotové mapy (UVTT/.dd2vtt): pozadí + mřížka + zdi + světla */}
                <button
                  type="button"
                  className={styles.newSceneBtn}
                  onClick={() => uvttInputRef.current?.click()}
                  disabled={importUvtt.isPending}
                  title="Naimportuje hotovou mapu ze souboru UVTT / .dd2vtt (Dungeondraft, DungeonFog) — vytvoří novou scénu se zdmi a světly"
                >
                  {importUvtt.isPending ? 'Importuji…' : '📥 Import UVTT'}
                </button>
                <input
                  ref={uvttInputRef}
                  type="file"
                  aria-label="Vybrat soubor UVTT / .dd2vtt k importu"
                  accept=".dd2vtt,.uvtt,.df2vtt,.json"
                  hidden
                  onChange={handleUvttFile}
                />
              </div>
            )}
            {importErrorMessage && (
              <p className={styles.error} role="alert">
                {importErrorMessage}
              </p>
            )}
            <ActiveScenesList
              scenes={activeScenes}
              currentSceneId={currentScene?.id ?? null}
              onSwitch={handleSwitchSelf}
              switchDisabled={mutation.isPending}
              onEdit={setEditingScene}
              onDeactivate={setPendingDeactivateId}
              onClear={setPendingClearScene}
            />
            {createSceneMutation.isError && (
              <p className={styles.error} role="alert">
                Chyba:{' '}
                {createSceneMutation.error instanceof Error
                  ? createSceneMutation.error.message
                  : 'Nepodařilo se vytvořit scénu'}
              </p>
            )}
          </PaletteAccordion>

          {/* 10.2o — Přístup a viditelnost přesunut do nastavení scény (⚙ →
              EditSceneModal, sekce „Přístup hráčů"). Tady už není. */}

          {/* 10.2o — palety PC/NPC/Bestiář se rozevírají do boku (flyout), ne
              dolů. Trigger = řádek v panelu; obsah žije v plovoucím sloupci
              vpravo (viz `flyoutPanels` níže). Hledání + „+ z katalogu" jsou
              uvnitř flyoutu, seznam připravených tam má vlastní scroll. */}
          <button
            type="button"
            className={`${styles.flyoutTrigger} ${openFlyout === 'pc' ? styles.flyoutTriggerActive : ''}`}
            onClick={() => toggleFlyout('pc')}
            aria-expanded={openFlyout === 'pc'}
          >
            <span className={styles.flyoutTriggerChevron} aria-hidden>
              ▸
            </span>
            <span className={styles.flyoutTriggerTitle}>PC tokeny</span>
            <span className={styles.flyoutTriggerCount}>{paletteCounts.pc}</span>
          </button>

          <button
            type="button"
            className={`${styles.flyoutTrigger} ${openFlyout === 'npc' ? styles.flyoutTriggerActive : ''}`}
            onClick={() => toggleFlyout('npc')}
            aria-expanded={openFlyout === 'npc'}
          >
            <span className={styles.flyoutTriggerChevron} aria-hidden>
              ▸
            </span>
            <span className={styles.flyoutTriggerTitle}>NPC postavy</span>
            <span className={styles.flyoutTriggerCount}>{paletteCounts.npc}</span>
          </button>

          {systemId && (
            <button
              type="button"
              className={`${styles.flyoutTrigger} ${openFlyout === 'bestie' ? styles.flyoutTriggerActive : ''}`}
              onClick={() => toggleFlyout('bestie')}
              aria-expanded={openFlyout === 'bestie'}
            >
              <span className={styles.flyoutTriggerChevron} aria-hidden>
                ▸
              </span>
              <span className={styles.flyoutTriggerTitle}>Bestiář</span>
              <span className={styles.flyoutTriggerCount}>
                {paletteCounts.bestie}
              </span>
            </button>
          )}
        </div>
      )}

      {/* 10.2o — flyout sloupce palet (vpravo od panelu na desktopu, bottom
          sheet na mobilu). Mountované vždy (když je panel rozbalený), aby
          palety hlásily count do triggerů i když nejsou viditelné — viditelný
          je jen aktivní (`flyoutHidden` na ostatních). */}
      {expanded && (
        <>
          <div
            className={`${styles.flyout} ${openFlyout === 'pc' ? '' : styles.flyoutHidden}`}
          >
            <div className={styles.flyoutHeader}>
              <span className={styles.flyoutTitle}>PC tokeny</span>
              <button
                type="button"
                className={styles.flyoutClose}
                onClick={() => setOpenFlyout(null)}
                aria-label="Zavřít"
              >
                ✕
              </button>
            </div>
            <div className={styles.flyoutScroll}>
              <PcPalette
                worldId={worldId}
                scene={currentScene}
                onStartPlacement={onStartPlacement}
                onCountChange={setPcCount}
              />
            </div>
          </div>

          <div
            className={`${styles.flyout} ${openFlyout === 'npc' ? '' : styles.flyoutHidden}`}
          >
            <div className={styles.flyoutHeader}>
              <span className={styles.flyoutTitle}>NPC postavy</span>
              <button
                type="button"
                className={styles.flyoutClose}
                onClick={() => setOpenFlyout(null)}
                aria-label="Zavřít"
              >
                ✕
              </button>
            </div>
            <div className={styles.flyoutScroll}>
              <NpcCharacterPalette
                worldId={worldId}
                scene={currentScene}
                onStartPlacement={onStartPlacement}
                onCountChange={setNpcCount}
              />
            </div>
          </div>

          {systemId && (
            <div
              className={`${styles.flyout} ${openFlyout === 'bestie' ? '' : styles.flyoutHidden}`}
            >
              <div className={styles.flyoutHeader}>
                <span className={styles.flyoutTitle}>Bestiář</span>
                <button
                  type="button"
                  className={styles.flyoutClose}
                  onClick={() => setOpenFlyout(null)}
                  aria-label="Zavřít"
                >
                  ✕
                </button>
              </div>
              <div className={styles.flyoutScroll}>
                <BestiePalette
                  worldId={worldId}
                  systemId={systemId}
                  scene={currentScene}
                  onStartPlacement={onStartPlacement}
                  onCountChange={setBestieCount}
                />
              </div>
            </div>
          )}
        </>
      )}
      {showLoadPrep && (
        <LoadPreparationDialog
          worldId={worldId}
          currentUserId={currentUserId}
          onClose={() => setShowLoadPrep(false)}
        />
      )}
      {showLibrary && (
        <MapLibraryModal
          scene={currentScene}
          worldId={worldId}
          onClose={() => setShowLibrary(false)}
        />
      )}
      {editingScene && (
        <EditSceneModal
          scene={editingScene}
          onClose={() => setEditingScene(null)}
          onSaved={() => {
            setEditingScene(null);
            void queryClient.invalidateQueries({
              queryKey: mapSceneQueryKey(worldId),
            });
            // useActiveScenes query key (z hooks/useActiveScenes.ts).
            void queryClient.invalidateQueries({
              queryKey: ['map', 'world-active-scenes', worldId],
            });
          }}
        />
      )}
      {/* 10.2c-edit-1 — confirm dialog pro scene.deactivate. Cascade unassign
          dotčených hráčů (kteří mají currentSceneId === pendingDeactivateId) je
          irreverzibilní v MVP — varování vůči PJ. */}
      <ConfirmDialog
        open={pendingDeactivateId !== null}
        onClose={() => setPendingDeactivateId(null)}
        title="Deaktivovat scénu?"
        message="Tato scéna přestane být aktivní a všichni přiřazení hráči ji ztratí (budou bez scény, dokud je znovu nepřiřadíš). Pokračovat?"
        confirmLabel="Deaktivovat"
        confirmVariant="danger"
        isPending={deactivateMutation.isPending}
        onConfirm={() => {
          if (pendingDeactivateId) {
            deactivateMutation.mutate(pendingDeactivateId);
          }
        }}
      />
      {/* 10.2c-edit-7 — vyčistit scénu od tokenů (PC + NPC + bestie).
          Combat se ukončí implicitně v BE handleru.
          Aktivní set (activeCharacterIds/activeBestieIds) zůstává. */}
      {pendingClearScene && (
        <ClearSceneDialog
          scene={pendingClearScene}
          onClose={() => setPendingClearScene(null)}
          onConfirm={async () => {
            try {
              await postMapOperation(pendingClearScene.id, {
                type: 'scene.tokens.clear',
              });
              // Refetch pro jistotu (WS broadcast by měl stačit, ale belt-and-suspenders).
              void queryClient.invalidateQueries({
                queryKey: mapSceneQueryKey(worldId),
              });
            } catch (err) {
              toast.error(`Vyčištění scény selhalo: ${parseApiError(err)}`);
              throw err; // ClearSceneDialog nechá dialog otevřený pro retry.
            }
          }}
        />
      )}
    </aside>
  );
}
