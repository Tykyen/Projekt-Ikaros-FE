/**
 * 10.2e C8 → 10.2c-edit-7 → 10.2c-edit-9a — NPC postava paleta.
 *
 * Stejný pattern jako PcPalette — viz tam pro docs. NPC má `multi=true`
 * (PJ často spawn více kopií stejného NPC po sobě).
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

interface NpcCharacter {
  id: string;
  slug: string;
  name: string;
  isNpc: boolean;
  imageUrl?: string;
}

interface Props {
  worldId: string;
  scene: MapScene | null;
  /**
   * 10.2c-edit-9a — start placement mode. NPC = `multi=true` (multi-spawn).
   */
  onStartPlacement: (payload: SpawnPayload, multi: boolean) => void;
}

export function NpcCharacterPalette({
  worldId,
  scene,
  onStartPlacement,
}: Props): React.ReactElement {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCatalog, setShowCatalog] = useState(false);

  const charsQuery = useQuery({
    queryKey: ['characters', worldId, 'npc'],
    queryFn: () =>
      api
        .get<NpcCharacter[]>(`/worlds/${worldId}/characters`)
        .then((all) => all.filter((c) => c.isNpc)),
    enabled: Boolean(worldId),
  });

  const activeOp = useMutation({
    mutationFn: ({ sceneId, op }: { sceneId: string; op: MapOperation }) =>
      postMapOperation(sceneId, op),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: mapSceneQueryKey(worldId) }),
  });

  const buildPayload = (c: NpcCharacter): SpawnPayload => ({
    kind: 'npc',
    characterId: c.id,
    characterSlug: c.slug,
    name: c.name,
    imageUrl: c.imageUrl,
  });

  const handleClick = (c: NpcCharacter): void => {
    if (!scene) return;
    onStartPlacement(buildPayload(c), true);
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    c: NpcCharacter,
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

  const q = search.trim().toLowerCase();
  const filtered = q
    ? activeList.filter((c) => c.name.toLowerCase().includes(q))
    : activeList;

  if (charsQuery.isLoading) {
    return <p className={styles.empty}>Načítání NPC postav…</p>;
  }
  const catalogEmpty = fullCatalog.length === 0;

  return (
    <div className={styles.palette}>
      <div className={styles.toolbar}>
        <PaletteSearchInput
          value={search}
          onChange={setSearch}
          placeholder="Hledat aktivní NPC…"
        />
        <button
          type="button"
          className={styles.catalogBtn}
          onClick={() => setShowCatalog(true)}
          disabled={catalogEmpty || !scene}
          title={
            catalogEmpty
              ? 'V katalogu světa nejsou žádné NPC postavy.'
              : 'Přidat NPC postavu z katalogu světa do aktivních pro tuto scénu'
          }
        >
          + z katalogu
        </button>
      </div>

      {activeList.length === 0 ? (
        <p className={styles.empty}>
          {catalogEmpty
            ? 'Žádné NPC postavy ve světě.'
            : 'Žádné aktivní NPC. Klikni „+ z katalogu" a vyber.'}
        </p>
      ) : filtered.length === 0 ? (
        <p className={styles.empty}>Nic neodpovídá vyhledávání.</p>
      ) : (
        <div className={styles.list}>
          {filtered.map((c) => (
            <div key={c.id} className={styles.itemRow}>
              <button
                type="button"
                className={styles.item}
                draggable={!!scene}
                onClick={() => handleClick(c)}
                onDragStart={(e) => handleDragStart(e, c)}
                disabled={!scene}
                title={`Klikni nebo přetáhni: spawn NPC ${c.name} na hex`}
              >
                <span className={styles.itemName}>{c.name}</span>
                <span className={styles.itemAction}>⇢</span>
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
          ))}
        </div>
      )}

      {showCatalog && (
        <CharacterCatalogModal
          title="Katalog NPC postav světa"
          searchPlaceholder="Hledat NPC postavu…"
          items={fullCatalog.map((c) => ({ id: c.id, name: c.name }))}
          activeIds={activeIds}
          onPick={handleAddToActive}
          onClose={() => setShowCatalog(false)}
        />
      )}
    </div>
  );
}
