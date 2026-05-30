/**
 * 10.2d-B → 10.2c-edit-7 → 10.2c-edit-9a — Bestie spawn paleta.
 *
 * Aktivní list je flat (bez záložek MŮJ/SVĚT/SYSTEM) — PJ vybral pro
 * tuhle scénu mix bestií napříč scope. Katalog modal má 3 záložky uvnitř
 * pro výběr ze správného scope.
 *
 * 10.2c-edit-9a — spawn UX:
 *   - klik / drag&drop → `onStartPlacement(payload, multi=true)` (Bestie
 *     multi-spawn — typický use case: 5 banditů po sobě)
 *   - vlastní `token.add` řeší `TacticalMapView` (zná pozici hexu)
 *
 * `×` u řádky → `scene.activeBestie.remove`.
 * `+ z katalogu` → CharacterCatalogModal s tabs={MŮJ/SVĚT/SYSTEM}.
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBestiar } from '@/features/world/bestiar/hooks/useBestiar';
import { postMapOperation } from '../../api/mapApi';
import { mapSceneQueryKey } from '../../hooks/useMapScene';
import { PaletteSearchInput } from './PaletteSearchInput';
import { PaletteAvatar } from './PaletteAvatar';
import { CharacterCatalogModal } from './CharacterCatalogModal';
import {
  type SpawnPayload,
  writeSpawnPayload,
} from '../../utils/spawnPayload';
import type { Bestie } from '@/features/world/bestiar/types';
import type { MapScene, MapOperation } from '../../types';
import styles from './BestiePalette.module.css';

interface Props {
  worldId: string;
  systemId: string;
  scene: MapScene | null;
  /**
   * 10.2c-edit-9a — start placement mode. Bestie = `multi=true`.
   */
  onStartPlacement: (payload: SpawnPayload, multi: boolean) => void;
}

export function BestiePalette({
  worldId,
  systemId,
  scene,
  onStartPlacement,
}: Props): React.ReactElement {
  const query = useBestiar(worldId, systemId);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCatalog, setShowCatalog] = useState(false);

  const activeOp = useMutation({
    mutationFn: ({
      sceneId,
      op,
    }: {
      sceneId: string;
      op: MapOperation;
    }) => postMapOperation(sceneId, op),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mapSceneQueryKey(worldId),
      });
    },
  });

  const buildPayload = (bestie: Bestie): SpawnPayload => ({
    kind: 'bestie',
    bestieId: bestie.id,
    name: bestie.name,
  });

  const handleClick = (bestie: Bestie): void => {
    if (!scene) return;
    onStartPlacement(buildPayload(bestie), true);
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    bestie: Bestie,
  ): void => {
    if (!scene) return;
    writeSpawnPayload(e.dataTransfer, buildPayload(bestie));
  };

  const handleAddToActive = (item: { id: string }): void => {
    if (!scene) return;
    activeOp.mutate({
      sceneId: scene.id,
      op: { type: 'scene.activeBestie.add', bestieId: item.id },
    });
  };

  const handleRemoveFromActive = (bestieId: string): void => {
    if (!scene) return;
    activeOp.mutate({
      sceneId: scene.id,
      op: { type: 'scene.activeBestie.remove', bestieId },
    });
  };

  const allBestie: Bestie[] = [
    ...(query.data?.user ?? []),
    ...(query.data?.world ?? []),
    ...(query.data?.system ?? []),
  ];
  const activeIds = new Set(scene?.activeBestieIds ?? []);
  const activeList = allBestie.filter((b) => activeIds.has(b.id));

  const q = search.trim().toLowerCase();
  const filtered = q
    ? activeList.filter((b) => b.name.toLowerCase().includes(q))
    : activeList;

  const catalogEmpty = allBestie.length === 0;

  return (
    <div className={styles.palette}>
      <div className={styles.toolbar}>
        <PaletteSearchInput
          value={search}
          onChange={setSearch}
          placeholder="Hledat aktivní bestii…"
        />
        <button
          type="button"
          className={styles.catalogBtn}
          onClick={() => setShowCatalog(true)}
          disabled={catalogEmpty || !scene}
          title={
            catalogEmpty
              ? 'V katalogu nejsou žádné bestie.'
              : 'Přidat bestii z katalogu (MŮJ / SVĚT / SYSTÉM) do aktivních pro tuto scénu'
          }
        >
          + z katalogu
        </button>
      </div>

      {query.isLoading && <p className={styles.empty}>Načítání…</p>}

      {!query.isLoading && activeList.length === 0 && (
        <p className={styles.empty}>
          {catalogEmpty
            ? 'Žádné bestie. Vytvoř v sekci Bestiář.'
            : 'Žádné aktivní bestie. Klikni „+ z katalogu" a vyber.'}
        </p>
      )}

      {!query.isLoading && activeList.length > 0 && filtered.length === 0 && (
        <p className={styles.empty}>Nic neodpovídá vyhledávání.</p>
      )}

      <div className={styles.list}>
        {filtered.map((b) => (
          <div key={b.id} className={styles.itemRow}>
            <button
              type="button"
              className={styles.item}
              draggable={!!scene}
              onClick={() => handleClick(b)}
              onDragStart={(e) => handleDragStart(e, b)}
              disabled={!scene}
              title={`Klikni nebo přetáhni: spawn bestie ${b.name} na hex`}
            >
              <PaletteAvatar src={b.imageUrl} name={b.name} />
              <span className={styles.itemName}>{b.name}</span>
              <span className={styles.itemAction}>⇢</span>
            </button>
            <button
              type="button"
              className={styles.removeActiveBtn}
              onClick={() => handleRemoveFromActive(b.id)}
              disabled={activeOp.isPending || !scene}
              title={`Odebrat ${b.name} z aktivních`}
              aria-label={`Odebrat ${b.name} z aktivních`}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {showCatalog && (
        <CharacterCatalogModal
          title="Katalog bestií"
          searchPlaceholder="Hledat bestii…"
          tabs={[
            { key: 'user', label: 'Můj' },
            { key: 'world', label: 'Svět' },
            { key: 'system', label: 'Systém' },
          ]}
          itemsByTab={{
            user: (query.data?.user ?? []).map((b) => ({
              id: b.id,
              name: b.name,
              imageUrl: b.imageUrl,
            })),
            world: (query.data?.world ?? []).map((b) => ({
              id: b.id,
              name: b.name,
              imageUrl: b.imageUrl,
            })),
            system: (query.data?.system ?? []).map((b) => ({
              id: b.id,
              name: b.name,
              imageUrl: b.imageUrl,
            })),
          }}
          activeIds={activeIds}
          onPick={handleAddToActive}
          onClose={() => setShowCatalog(false)}
        />
      )}
    </div>
  );
}
