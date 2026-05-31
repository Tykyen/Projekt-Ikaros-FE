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
import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActiveScenes } from '../../hooks/useActiveScenes';
import { mapSceneQueryKey } from '../../hooks/useMapScene';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import { api, apiClient } from '@/shared/api/client';
import { ConfirmDialog } from '@/shared/ui';
import { postWorldOperation } from '../../api/worldOpsApi';
import { postMapOperation } from '../../api/mapApi';
import { activeScenesQueryKey } from '../../hooks/useActiveScenes';
import { ActiveScenesList } from './ActiveScenesList';
import { AccessBoard } from './AccessBoard';
import { PaletteAccordion } from './PaletteAccordion';
import { BestiePalette } from './BestiePalette';
import { PcPalette } from './PcPalette';
import { NpcCharacterPalette } from './NpcCharacterPalette';
import { EditSceneModal } from './EditSceneModal';
import { MapLibraryModal } from './MapLibraryModal';
import { ClearSceneDialog } from './ClearSceneDialog';
import { useWorldContext } from '@/features/world/context/WorldContext';
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
}

const PJ_PANEL_OPEN_KEY = 'ikr-map-pj-panel-open';

export function MapPjPanel({
  worldId,
  currentScene,
  currentUserId,
  onStartPlacement,
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
  const [showLibrary, setShowLibrary] = useState(false);
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
  const membersQuery = useWorldMembers(worldId);
  const { world } = useWorldContext();
  const systemId = world?.system ?? null;

  const mutation = useMutation({
    mutationFn: (op: WorldOperation) => postWorldOperation(worldId, op),
    onSuccess: () => {
      // Invalidate members (refresh currentSceneId-y) + mou scénu (pokud se self switch)
      void queryClient.invalidateQueries({ queryKey: ['worlds', worldId, 'members'] });
      void queryClient.invalidateQueries({ queryKey: mapSceneQueryKey(worldId) });
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
    onError: () => {
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
      void queryClient.invalidateQueries({
        queryKey: ['map', 'world-scenes', worldId, 'active'],
      });
    },
  });

  const handleAssign = (userId: string, sceneId: string): void => {
    mutation.mutate({ type: 'member.assignToScene', userId, sceneId });
  };

  const handleUnassign = (userId: string): void => {
    mutation.mutate({ type: 'member.unassign', userId });
  };

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
            </div>
            <ActiveScenesList
              scenes={activeScenes}
              currentSceneId={currentScene?.id ?? null}
              onSwitch={handleSwitchSelf}
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

          {/* 10.2n — Přístup a viditelnost (nahradilo Rozmístění hráčů):
              per-scéna i per-hráč skrytí/zámek + přiřazení. Skryté pokud svět
              nemá hratelné členy (loading state záměrně neukazujeme). */}
          {(membersQuery.data?.length ?? 0) > 0 && (
            <PaletteAccordion
              id="access"
              title="Přístup a viditelnost"
              count={activeScenes.length}
            >
              <AccessBoard
                worldId={worldId}
                members={membersQuery.data ?? []}
                activeScenes={activeScenes}
                onAssign={handleAssign}
                onUnassign={handleUnassign}
              />
            </PaletteAccordion>
          )}

          {/* 10.2n — spawn palety jako sbalitelné accordiony (default sbalené,
              počet aktivních v hlavičce) — zvládne 10+ entit bez nekonečného
              scrollu a vnořených scrollů. */}
          <PaletteAccordion id="pc" title="PC tokeny" count={paletteCounts.pc}>
            <PcPalette
              worldId={worldId}
              scene={currentScene}
              onStartPlacement={onStartPlacement}
              onCountChange={setPcCount}
            />
          </PaletteAccordion>

          <PaletteAccordion
            id="npc"
            title="NPC postavy"
            count={paletteCounts.npc}
          >
            <NpcCharacterPalette
              worldId={worldId}
              scene={currentScene}
              onStartPlacement={onStartPlacement}
              onCountChange={setNpcCount}
            />
          </PaletteAccordion>

          {systemId && (
            <PaletteAccordion
              id="bestie"
              title="Bestiář"
              count={paletteCounts.bestie}
            >
              <BestiePalette
                worldId={worldId}
                systemId={systemId}
                scene={currentScene}
                onStartPlacement={onStartPlacement}
                onCountChange={setBestieCount}
              />
            </PaletteAccordion>
          )}
        </div>
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
            await postMapOperation(pendingClearScene.id, {
              type: 'scene.tokens.clear',
            });
            // Refetch pro jistotu (WS broadcast by měl stačit, ale belt-and-suspenders).
            void queryClient.invalidateQueries({
              queryKey: mapSceneQueryKey(worldId),
            });
          }}
        />
      )}
    </aside>
  );
}
