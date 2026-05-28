/**
 * 10.2c-edit — MapLibraryModal (knihovna map / templates).
 *
 * Matrix legacy ekvivalent — PJ má list znovupoužitelných map (background +
 * config) které může aplikovat na aktuální scénu nebo uložit aktuální scénu
 * jako novou template. BE endpoint `/api/map-templates`.
 *
 * Flow:
 *  - List → klik na template → load (apply scene.image + scene.config ops)
 *  - "+ Uložit aktuální scénu" → POST nový template (name + imageUrl + config)
 *  - Smazat (jen PJ/Sa)
 */
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { Modal, Button, ConfirmDialog } from '@/shared/ui';
import { api, apiClient } from '@/shared/api/client';
import { currentUserAtom } from '@/shared/store/authStore';
import { mapSceneQueryKey } from '../../hooks/useMapScene';
import { activeScenesQueryKey } from '../../hooks/useActiveScenes';
import { postWorldOperation } from '../../api/worldOpsApi';
import type { MapScene } from '../../types';
import styles from './MapLibraryModal.module.css';

/**
 * 10.2c-edit-2 — full-snapshot MapTemplate.
 *
 * Šablona obsahuje vše kromě PC tokenů (BE filtruje server-side, FE pro
 * jistotu taky). Load aplikuje sekvenci 7 ops.
 */
interface MapTemplate {
  id: string;
  ownerId: string;
  name: string;
  imageUrl: string;
  config: Record<string, unknown>;
  npcTemplates?: unknown[];
  tokens?: Array<Record<string, unknown>>;
  effects?: unknown[];
  fogEnabled?: boolean;
  revealedHexes?: unknown[];
  activeSoundIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface Props {
  scene: MapScene | null;
  worldId: string;
  onClose: () => void;
}

export function MapLibraryModal({
  scene,
  worldId,
  onClose,
}: Props): React.ReactElement {
  const qc = useQueryClient();
  const currentUser = useAtomValue(currentUserAtom);
  const [error, setError] = useState<string | null>(null);
  const [saveName, setSaveName] = useState(scene?.name ?? 'Nová šablona');
  /**
   * 10.2c-edit-3 — pending template pro confirm dialog (load vytvoří
   * NOVOU scénu z šablony; PJ se na ni automaticky přepne. Current scéna
   * se NEpřepíše — zůstává paralelně aktivní).
   */
  const [pendingLoadTemplate, setPendingLoadTemplate] =
    useState<MapTemplate | null>(null);

  const listQuery = useQuery({
    queryKey: ['map-templates'],
    queryFn: () => api.get<MapTemplate[]>('/map-templates'),
  });

  /**
   * 10.2c-edit-3 — load vytvoří NOVOU scénu z šablony (POST /maps),
   * aktivuje ji a přepne na ni PJ. Current scéna se NEpřepíše —
   * zůstává paralelně aktivní ve světě (memory project_takticka_mapa_assignment:
   * víc scén může být isActive: true paralelně).
   *
   * Flow:
   *   1. POST /maps s name + image + config + fog + effects + npc + tokens + sounds
   *   2. POST /maps/:newId/active (paralelní aktivace; netýká se ostatních scén)
   *   3. POST /worlds/:worldId/operations member.assignToScene self → newId
   *   4. Invalidate active scenes list + mapScene query → autoload
   */
  const loadMutation = useMutation({
    mutationFn: async (template: MapTemplate): Promise<{ id: string }> => {
      if (!currentUser?.id) throw new Error('Neznámý uživatel');

      // 1. Vytvořit novou scénu s plným snapshotem template
      const newScene = await api.post<{ id: string }>('/maps', {
        worldId,
        name: template.name,
        imageUrl: template.imageUrl,
        config: template.config,
        // Defense in depth — server taky filtruje PC tokeny při load
        tokens: (template.tokens ?? []).filter(
          (t) => (t as { isNpc?: boolean }).isNpc === true,
        ),
        npcTemplates: template.npcTemplates ?? [],
        effects: template.effects ?? [],
        fogEnabled: template.fogEnabled ?? false,
        revealedHexes: template.revealedHexes ?? [],
        activeSoundIds: template.activeSoundIds ?? [],
      });

      // 2. Aktivovat scénu (paralelně, nemizí ostatní díky setActive fixu)
      await apiClient.post(`/maps/${newScene.id}/active`, undefined, {
        params: { worldId },
      });

      // 3. Přepnout PJ self na novou scénu
      await postWorldOperation(worldId, {
        type: 'member.assignToScene',
        userId: currentUser.id,
        sceneId: newScene.id,
      });

      return newScene;
    },
    onSuccess: () => {
      // Active scenes list (PJ panel) + current scene query (TacticalMapView)
      qc.invalidateQueries({ queryKey: activeScenesQueryKey(worldId) });
      qc.invalidateQueries({ queryKey: mapSceneQueryKey(worldId) });
      qc.invalidateQueries({ queryKey: ['worlds', worldId, 'members'] });
      setPendingLoadTemplate(null);
      onClose();
    },
    onError: (e) => {
      setError(e instanceof Error ? e.message : 'Načtení selhalo');
      setPendingLoadTemplate(null);
    },
  });

  /**
   * 10.2c-edit-2 — full-snapshot save. Ukládáme všechno kromě PC tokenů
   * (filtered FE: t.isNpc === true; BE pro jistotu dělá totéž).
   */
  const saveMutation = useMutation({
    mutationFn: async (): Promise<MapTemplate> => {
      if (!scene) throw new Error('Žádná aktivní scéna');
      return api.post<MapTemplate>('/map-templates', {
        name: saveName.trim(),
        imageUrl: scene.imageUrl,
        config: scene.config,
        tokens: scene.tokens.filter((t) => t.isNpc === true),
        npcTemplates: scene.npcTemplates ?? [],
        effects: scene.effects ?? [],
        fogEnabled: scene.fogEnabled ?? false,
        revealedHexes: scene.revealedHexes ?? [],
        activeSoundIds: scene.activeSoundIds ?? [],
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['map-templates'] });
      setSaveName(scene?.name ?? 'Nová šablona');
    },
    onError: (e) =>
      setError(e instanceof Error ? e.message : 'Uložení selhalo'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/map-templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['map-templates'] }),
    onError: (e) =>
      setError(e instanceof Error ? e.message : 'Smazání selhalo'),
  });

  const handleDelete = (t: MapTemplate): void => {
    if (!confirm(`Trvale smazat šablonu "${t.name}"?`)) return;
    deleteMutation.mutate(t.id);
  };

  const templates = listQuery.data ?? [];

  return (
    <Modal
      open
      onClose={onClose}
      title="Knihovna map"
      size="lg"
      footer={
        <div className={styles.footer}>
          <Button variant="ghost" onClick={onClose}>
            Zavřít
          </Button>
        </div>
      }
    >
      <div className={styles.body}>
        {scene && (
          <section className={styles.saveSection}>
            <h4 className={styles.sectionTitle}>Uložit aktuální scénu jako šablonu</h4>
            <div className={styles.saveRow}>
              <input
                type="text"
                className={styles.input}
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Jméno šablony"
                maxLength={100}
              />
              <Button
                variant="primary"
                onClick={() => saveMutation.mutate()}
                disabled={
                  saveMutation.isPending || !saveName.trim() || !scene.imageUrl
                }
                loading={saveMutation.isPending}
              >
                + Uložit
              </Button>
            </div>
            {!scene.imageUrl && (
              <p className={styles.hint}>
                Scéna nemá pozadí — nahraj nejdřív mapu v „⚙ Upravit scénu".
              </p>
            )}
          </section>
        )}

        <section className={styles.listSection}>
          <h4 className={styles.sectionTitle}>Dostupné mapy ({templates.length})</h4>
          {listQuery.isLoading && <p className={styles.empty}>Načítání…</p>}
          {listQuery.isError && (
            <p className={styles.empty} role="alert">
              Chyba načítání knihovny.
            </p>
          )}
          {!listQuery.isLoading && templates.length === 0 && (
            <p className={styles.empty}>
              Knihovna prázdná. Ulož aktuální scénu jako první šablonu.
            </p>
          )}
          <div className={styles.grid}>
            {templates.map((t) => (
              <div key={t.id} className={styles.card}>
                <div className={styles.preview}>
                  {t.imageUrl ? (
                    <img src={t.imageUrl} alt={t.name} />
                  ) : (
                    <div className={styles.previewEmpty}>bez pozadí</div>
                  )}
                </div>
                <div className={styles.cardBody}>
                  <h5 className={styles.cardName}>{t.name}</h5>
                  <div className={styles.cardActions}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setPendingLoadTemplate(t)}
                      disabled={loadMutation.isPending}
                    >
                      Načíst
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(t)}
                      disabled={deleteMutation.isPending}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
      {/* 10.2c-edit-3 — confirm před vytvořením nové scény ze šablony.
          PJ se na novou scénu automaticky přepne; současné scény zůstávají. */}
      <ConfirmDialog
        open={pendingLoadTemplate !== null}
        onClose={() => setPendingLoadTemplate(null)}
        title="Načíst šablonu jako novou scénu?"
        message={
          <>
            Vytvořím novou aktivní scénu se vším z šablony (pozadí, NPC, efekty,
            mlha, zvuky) a přepnu tě na ni. Současné scény zůstanou nezměněné.
            {pendingLoadTemplate?.name && (
              <>
                <br />
                <strong>{pendingLoadTemplate.name}</strong>
              </>
            )}
          </>
        }
        confirmLabel="Vytvořit novou scénu"
        confirmVariant="primary"
        isPending={loadMutation.isPending}
        onConfirm={() => {
          if (pendingLoadTemplate) loadMutation.mutate(pendingLoadTemplate);
        }}
      />
    </Modal>
  );
}
