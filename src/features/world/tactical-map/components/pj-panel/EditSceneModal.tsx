/**
 * 10.2c-edit — Edit scene UI (jméno + image upload + hex config).
 *
 * Per scéna: PJ může změnit:
 *   - name (scene.name op)
 *   - imageUrl (scene.image op, upload přes useUploadImage)
 *   - config: size, originX, originY, showGrid (scene.config op)
 *
 * Save = sériový dispatch operations (per-change).
 */
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Modal, Button } from '@/shared/ui';
import { useUploadImage } from '@/shared/api/useUploadImage';
import { postMapOperation } from '../../api/mapApi';
import { SceneAccessSection } from './SceneAccessSection';
import type { MapScene, MapOperation, HexConfig } from '../../types';
import styles from './EditSceneModal.module.css';

interface Props {
  scene: MapScene;
  onClose: () => void;
  onSaved: () => void;
}

interface ExtendedConfig extends HexConfig {
  backgroundScale?: number;
  backgroundX?: number;
  backgroundY?: number;
}

export function EditSceneModal({
  scene,
  onClose,
  onSaved,
}: Props): React.ReactElement {
  const [name, setName] = useState(scene.name);
  const [imageUrl, setImageUrl] = useState(scene.imageUrl);
  const [config, setConfig] = useState<ExtendedConfig>({
    ...scene.config,
    backgroundScale:
      (scene.config as unknown as { backgroundScale?: number })
        .backgroundScale ?? 1,
    backgroundX:
      (scene.config as unknown as { backgroundX?: number }).backgroundX ?? 0,
    backgroundY:
      (scene.config as unknown as { backgroundY?: number }).backgroundY ?? 0,
    // 10.2g — viditelnost HP barů (chybí v configu = default zapnuto).
    showHpPc: scene.config.showHpPc ?? true,
    showHpNpc: scene.config.showHpNpc ?? true,
    showHpBestie: scene.config.showHpBestie ?? true,
  });
  const [error, setError] = useState<string | null>(null);

  const upload = useUploadImage();

  const saveMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      const ops: MapOperation[] = [];
      if (name.trim() !== scene.name) {
        ops.push({ type: 'scene.name', name: name.trim() });
      }
      if (imageUrl !== scene.imageUrl) {
        ops.push({ type: 'scene.image', imageUrl });
      }
      const prevExt = scene.config as unknown as ExtendedConfig;
      const configChanged =
        config.size !== scene.config.size ||
        config.originX !== scene.config.originX ||
        config.originY !== scene.config.originY ||
        config.showGrid !== scene.config.showGrid ||
        (config.backgroundScale ?? 1) !== (prevExt.backgroundScale ?? 1) ||
        (config.backgroundX ?? 0) !== (prevExt.backgroundX ?? 0) ||
        (config.backgroundY ?? 0) !== (prevExt.backgroundY ?? 0) ||
        (config.showHpPc ?? true) !== (scene.config.showHpPc ?? true) ||
        (config.showHpNpc ?? true) !== (scene.config.showHpNpc ?? true) ||
        (config.showHpBestie ?? true) !== (scene.config.showHpBestie ?? true);
      if (configChanged) {
        ops.push({ type: 'scene.config', config: config as HexConfig });
      }
      // Sériově dispatch (BE atomic per op).
      for (const op of ops) {
        await postMapOperation(scene.id, op);
      }
    },
    onSuccess: () => {
      onSaved();
    },
    onError: (e) => {
      setError(e instanceof Error ? e.message : 'Uložení selhalo');
    },
  });

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    upload.mutate(file, {
      onSuccess: (result) => setImageUrl(result.url),
      onError: (err) =>
        setError(
          err instanceof Error
            ? `Upload selhal: ${err.message}`
            : 'Upload selhal',
        ),
    });
  };

  const pending = saveMutation.isPending || upload.isPending;

  const footer = (
    <div className={styles.footer}>
      <Button variant="ghost" onClick={onClose} disabled={pending}>
        Zrušit
      </Button>
      <Button
        variant="primary"
        onClick={() => saveMutation.mutate()}
        disabled={pending || !name.trim()}
        loading={saveMutation.isPending}
      >
        Uložit
      </Button>
    </div>
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={`Upravit scénu: ${scene.name}`}
      size="lg"
      footer={footer}
    >
      <div className={styles.body}>
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Identita</h4>
          <label className={styles.label}>
            Jméno scény
            <input
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </label>
        </section>

        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Mapa (pozadí)</h4>
          <div className={styles.imageRow}>
            <div className={styles.imagePreview}>
              {imageUrl ? (
                <img src={imageUrl} alt="Náhled mapy" />
              ) : (
                <div className={styles.imagePlaceholder}>Bez pozadí</div>
              )}
            </div>
            <div className={styles.imageActions}>
              <label className={styles.uploadBtn}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={upload.isPending}
                  hidden
                />
                {upload.isPending ? 'Nahrávám…' : 'Nahrát soubor…'}
              </label>
              <input
                type="text"
                className={styles.input}
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="…nebo URL"
              />
              {imageUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setImageUrl('')}
                >
                  Odstranit pozadí
                </Button>
              )}
            </div>
          </div>
          {imageUrl && (
            <div className={styles.configGrid}>
              <label className={styles.label}>
                Měřítko mapy ({((config.backgroundScale ?? 1) * 100).toFixed(0)}%)
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.05"
                  value={config.backgroundScale ?? 1}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      backgroundScale: Number(e.target.value),
                    }))
                  }
                />
              </label>
              <label className={styles.label}>
                Posun X (px)
                <input
                  type="number"
                  className={styles.input}
                  value={config.backgroundX ?? 0}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      backgroundX: Number(e.target.value),
                    }))
                  }
                />
              </label>
              <label className={styles.label}>
                Posun Y (px)
                <input
                  type="number"
                  className={styles.input}
                  value={config.backgroundY ?? 0}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      backgroundY: Number(e.target.value),
                    }))
                  }
                />
              </label>
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Hex mřížka</h4>
          <div className={styles.configGrid}>
            <label className={styles.label}>
              Velikost hexu (px)
              <input
                type="number"
                className={styles.input}
                value={config.size}
                min={10}
                max={120}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, size: Number(e.target.value) }))
                }
              />
            </label>
            <label className={styles.label}>
              Origin X (px)
              <input
                type="number"
                className={styles.input}
                value={config.originX}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, originX: Number(e.target.value) }))
                }
              />
            </label>
            <label className={styles.label}>
              Origin Y (px)
              <input
                type="number"
                className={styles.input}
                value={config.originY}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, originY: Number(e.target.value) }))
                }
              />
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={config.showGrid}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, showGrid: e.target.checked }))
                }
              />
              Zobrazit grid
            </label>
          </div>
        </section>

        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Viditelnost HP</h4>
          <div className={styles.configGrid}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={config.showHpPc ?? true}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, showHpPc: e.target.checked }))
                }
              />
              HP u postav (PC)
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={config.showHpNpc ?? true}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, showHpNpc: e.target.checked }))
                }
              />
              HP u NPC
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={config.showHpBestie ?? true}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, showHpBestie: e.target.checked }))
                }
              />
              HP u bestií
            </label>
          </div>
        </section>

        {/* 10.2o — Přístup hráčů (přesunuto z orchestračního panelu).
            Pozn.: tato sekce se ukládá OKAMŽITĚ (na rozdíl od zbytku modalu,
            který čeká na „Uložit"). */}
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>
            Přístup hráčů{' '}
            <span className={styles.sectionHint}>(změny se projeví ihned)</span>
          </h4>
          <SceneAccessSection worldId={scene.worldId} sceneId={scene.id} />
        </section>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
