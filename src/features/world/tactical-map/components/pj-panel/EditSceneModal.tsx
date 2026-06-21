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
import type { GridType } from '../../grid';
import styles from './EditSceneModal.module.css';

/** 15.2 — volby typu mřížky pro segmentový selektor. */
const GRID_TYPES: { value: GridType; label: string }[] = [
  { value: 'hex', label: 'Hex' },
  { value: 'square', label: 'Čtverec' },
  { value: 'none', label: 'Žádná' },
];

/** Vizuální glyf typu mřížky (stroke = currentColor → dědí barvu aktivního/neaktivního stavu). */
function GridTypeGlyph({ type }: { type: GridType }): React.ReactElement {
  const common = {
    width: 26,
    height: 26,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinejoin: 'round' as const,
    className: styles.gridTypeIcon,
    'aria-hidden': true,
  };
  if (type === 'hex') {
    // Flat-top hexagon.
    return (
      <svg {...common}>
        <path d="M7 3 H17 L22 12 L17 21 H7 L2 12 Z" />
      </svg>
    );
  }
  if (type === 'square') {
    // 2×2 mřížka.
    return (
      <svg {...common}>
        <rect x="3" y="3" width="18" height="18" rx="1" />
        <path d="M12 3 V21 M3 12 H21" />
      </svg>
    );
  }
  // none — přerušovaný obrys + diagonála (= bez mřížky).
  return (
    <svg {...common}>
      <rect x="3" y="3" width="18" height="18" rx="1" strokeDasharray="3 3" />
      <path d="M5 19 L19 5" opacity="0.6" />
    </svg>
  );
}

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
        (config.gridType ?? 'hex') !== (scene.config.gridType ?? 'hex') ||
        (config.unitsPerCell ?? 1) !== (scene.config.unitsPerCell ?? 1) ||
        (config.unitLabel ?? 'm') !== (scene.config.unitLabel ?? 'm') ||
        (config.showScale ?? true) !== (scene.config.showScale ?? true) ||
        (config.allowPlayerDrawing ?? false) !==
          (scene.config.allowPlayerDrawing ?? false) ||
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
  // 15.2 — legacy scény bez gridType = hex (BC).
  const gridType = config.gridType ?? 'hex';

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
          <h4 className={styles.sectionTitle}>Mřížka</h4>
          {/* 15.2 — typ mřížky per scéna (hex/čtverec/žádná). */}
          <div
            className={styles.gridTypeSelector}
            role="radiogroup"
            aria-label="Typ mřížky"
          >
            {GRID_TYPES.map((opt) => {
              const active = gridType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={
                    active
                      ? `${styles.gridTypeOption} ${styles.gridTypeOptionActive}`
                      : styles.gridTypeOption
                  }
                  onClick={() =>
                    setConfig((c) => ({ ...c, gridType: opt.value }))
                  }
                >
                  <GridTypeGlyph type={opt.value} />
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div className={styles.configGrid}>
            <label className={styles.label}>
              Velikost buňky (px)
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
            {/* `none` nikdy nekreslí čáry → toggle „Zobrazit grid" je pro něj
                bezpředmětný (skryt). */}
            {gridType !== 'none' && (
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
            )}
          </div>
        </section>

        {/* 15.3 — měřítko scény (viditelné hráčům přes stupnici po okraji mapy). */}
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Měřítko</h4>
          <div className={styles.configGrid}>
            <label className={styles.label}>
              Jednotek na buňku
              <input
                type="number"
                className={styles.input}
                value={config.unitsPerCell ?? 1}
                min={0.1}
                step={0.1}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    unitsPerCell: Number(e.target.value),
                  }))
                }
              />
            </label>
            <label className={styles.label}>
              Jednotka
              <input
                type="text"
                className={styles.input}
                value={config.unitLabel ?? 'm'}
                maxLength={8}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, unitLabel: e.target.value }))
                }
              />
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={config.showScale ?? true}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, showScale: e.target.checked }))
                }
              />
              Zobrazit stupnici
            </label>
          </div>
        </section>

        {/* 15.4 — povolení kreslení hráčům na této scéně. */}
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Kreslení</h4>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={config.allowPlayerDrawing ?? false}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  allowPlayerDrawing: e.target.checked,
                }))
              }
            />
            Hráči smí kreslit anotace
          </label>
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
