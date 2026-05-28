/**
 * 10.2e C7 → 10.2c-edit-7 → 10.2c-edit-9a — PC token spawn paleta.
 *
 * Defaultně paleta zobrazuje JEN postavy v `scene.activeCharacterIds`
 * (= předvybraný set per scéna). Katalog všech PC postav světa je
 * dosažitelný přes „+ z katalogu" → otevře CharacterCatalogModal.
 *
 * 10.2c-edit-9a — spawn UX:
 *   - **drag & drop** — taháme řádek na mapu, drop na hex
 *   - **klik** — zapne placement mode (banner „Klikni na hex…")
 *   Vlastní spawn (`token.add`) řeší `TacticalMapView` v obou cestách,
 *   paleta jen propaguje `SpawnPayload` přes `onStartPlacement` prop.
 *
 * Operace:
 *   - drag start / klik na řádku → `onStartPlacement(payload, multi=false)`
 *   - klik na × u řádky: `scene.activeCharacters.remove`
 *   - klik na položku v modal katalogu: `scene.activeCharacters.add`
 */
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { postMapOperation } from '../../api/mapApi';
import { mapSceneQueryKey } from '../../hooks/useMapScene';
import { PaletteSearchInput } from './PaletteSearchInput';
import { CharacterCatalogModal } from './CharacterCatalogModal';
import {
  type SpawnPayload,
  writeSpawnPayload,
} from '../../utils/spawnPayload';
import type { MapScene, MapOperation } from '../../types';
import styles from './BestiePalette.module.css';

interface PcCharacter {
  id: string;
  slug: string;
  name: string;
  isNpc: boolean;
  userId?: string;
  imageUrl?: string;
}

interface Props {
  worldId: string;
  scene: MapScene | null;
  /**
   * 10.2c-edit-9a — start placement mode (klik = 2-step spawn).
   * `multi=false` pro PC (single spawn, mode se vypne po umístění).
   */
  onStartPlacement: (payload: SpawnPayload, multi: boolean) => void;
}

export function PcPalette({
  worldId,
  scene,
  onStartPlacement,
}: Props): React.ReactElement {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCatalog, setShowCatalog] = useState(false);

  const charsQuery = useQuery({
    queryKey: ['characters', worldId, 'pc'],
    queryFn: () =>
      api.get<PcCharacter[]>(`/worlds/${worldId}/characters/players`),
    enabled: Boolean(worldId),
  });

  const activeOp = useMutation({
    mutationFn: ({ sceneId, op }: { sceneId: string; op: MapOperation }) =>
      postMapOperation(sceneId, op),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: mapSceneQueryKey(worldId) }),
  });

  const buildPayload = (c: PcCharacter): SpawnPayload => ({
    kind: 'pc',
    characterId: c.id,
    characterSlug: c.slug,
    name: c.name,
    imageUrl: c.imageUrl,
  });

  const handleClick = (c: PcCharacter): void => {
    if (!scene) return;
    onStartPlacement(buildPayload(c), false);
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    c: PcCharacter,
  ): void => {
    if (!scene) return;
    writeSpawnPayload(e.dataTransfer, buildPayload(c));
  };

  const handleAddToActive = (item: { id: string }): void => {
    if (!scene) return;
    activeOp.mutate({
      sceneId: scene.id,
      op: { type: 'scene.activeCharacters.add', characterId: item.id },
    });
  };

  const handleRemoveFromActive = (characterId: string): void => {
    if (!scene) return;
    activeOp.mutate({
      sceneId: scene.id,
      op: { type: 'scene.activeCharacters.remove', characterId },
    });
  };

  const fullCatalog = charsQuery.data ?? [];
  const activeIds = new Set(scene?.activeCharacterIds ?? []);
  const activeList = fullCatalog.filter((c) => activeIds.has(c.id));

  const alreadyOnScene = (slug: string): boolean =>
    !!scene?.tokens.some((t) => t.characterSlug === slug && !t.isNpc);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? activeList.filter((c) => c.name.toLowerCase().includes(q))
    : activeList;

  if (charsQuery.isLoading) {
    return <p className={styles.empty}>Načítání PC postav…</p>;
  }
  if (charsQuery.isError) {
    return (
      <p className={styles.empty} role="alert">
        Chyba načítání postav.
      </p>
    );
  }

  const catalogEmpty = fullCatalog.length === 0;

  return (
    <div className={styles.palette}>
      <div className={styles.toolbar}>
        <PaletteSearchInput
          value={search}
          onChange={setSearch}
          placeholder="Hledat aktivní PC…"
        />
        <button
          type="button"
          className={styles.catalogBtn}
          onClick={() => setShowCatalog(true)}
          disabled={catalogEmpty || !scene}
          title={
            catalogEmpty
              ? 'V katalogu světa nejsou žádné PC postavy.'
              : 'Přidat PC postavu z katalogu světa do aktivních pro tuto scénu'
          }
        >
          + z katalogu
        </button>
      </div>

      {activeList.length === 0 ? (
        <p className={styles.empty}>
          {catalogEmpty
            ? 'Žádné PC postavy ve světě. Vytvoř je přes „Postavy" v top-nav.'
            : 'Žádné aktivní PC postavy. Klikni „+ z katalogu" a vyber.'}
        </p>
      ) : filtered.length === 0 ? (
        <p className={styles.empty}>Nic neodpovídá vyhledávání.</p>
      ) : (
        <div className={styles.list}>
          {filtered.map((c) => {
            const onScene = alreadyOnScene(c.slug);
            const disabled = !scene || onScene;
            return (
              <div key={c.id} className={styles.itemRow}>
                <button
                  type="button"
                  className={styles.item}
                  draggable={!disabled}
                  onClick={() => !disabled && handleClick(c)}
                  onDragStart={(e) => handleDragStart(e, c)}
                  disabled={disabled}
                  title={
                    onScene
                      ? `${c.name} už je na scéně`
                      : `Klikni nebo přetáhni: spawn PC ${c.name} na hex`
                  }
                >
                  <span className={styles.itemName}>{c.name}</span>
                  <span className={styles.itemAction}>
                    {onScene ? '✓' : '⇢'}
                  </span>
                </button>
                <button
                  type="button"
                  className={styles.removeActiveBtn}
                  onClick={() => handleRemoveFromActive(c.id)}
                  disabled={activeOp.isPending || !scene}
                  title={`Odebrat ${c.name} z aktivních (postava v DB zůstane)`}
                  aria-label={`Odebrat ${c.name} z aktivních`}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showCatalog && (
        <CharacterCatalogModal
          title="Katalog PC postav světa"
          searchPlaceholder="Hledat PC postavu…"
          items={fullCatalog.map((c) => ({ id: c.id, name: c.name }))}
          activeIds={activeIds}
          onPick={handleAddToActive}
          onClose={() => setShowCatalog(false)}
        />
      )}
    </div>
  );
}
