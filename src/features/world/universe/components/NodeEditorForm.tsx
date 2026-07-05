// 10.1c — formulář přidání/úpravy uzlu. Pracuje nad draftem (orchestrátor).
import { useState } from 'react';
import { toast } from 'sonner';
import { useUploadImage } from '@/shared/api';
import { NamedColorPalette } from '@/shared/ui';
import { PagePicker } from '@/features/world/components/PagePicker/PagePicker';
import { UNIVERSE_NODE_TYPES } from '../types';
import type { UniverseNode, UniverseNodeType } from '../types';
import { VisibilityEditor } from './VisibilityEditor';
import styles from './UniversePanel.module.css';

interface Props {
  worldId: string;
  /** null = nový uzel, jinak editace existujícího. */
  editingNode: UniverseNode | null;
  onSubmit: (node: UniverseNode) => void;
  onCancel: () => void;
}

function blankNode(): UniverseNode {
  return {
    id: '',
    name: '',
    type: 'planet',
    color: '#ffee00',
    size: 5,
    alliance: '',
    isPublic: true,
    visibleToPlayerIds: [],
    hasRing: false,
  };
}

export function NodeEditorForm({
  worldId,
  editingNode,
  onSubmit,
  onCancel,
}: Props) {
  // init z prop; reset při změně editovaného uzlu řeší `key` v orchestrátoru.
  const [form, setForm] = useState<UniverseNode>(() =>
    editingNode ? { ...editingNode } : blankNode(),
  );
  const upload = useUploadImage();

  const patch = (p: Partial<UniverseNode>) => setForm((f) => ({ ...f, ...p }));

  const handleUpload = async (file: File) => {
    try {
      const res = await upload.mutateAsync(file);
      patch({ img: res.url });
    } catch {
      toast.error('Nepodařilo se nahrát obrázek.');
    }
  };

  const submit = () => {
    const name = form.name.trim();
    if (!name) return;
    onSubmit({
      ...form,
      name,
      size: Math.max(1, form.size),
      // nový uzel dostane stabilní id; existující si ho drží
      id: form.id || (crypto.randomUUID?.() ?? `n_${Date.now()}`),
    });
  };

  return (
    <div className={styles.formGroup}>
      <h3 className={styles.sectionTitle}>
        {editingNode ? 'Upravit těleso' : 'Nové těleso'}
      </h3>

      <input
        className={styles.input}
        type="text"
        placeholder="Jméno (Země)"
        value={form.name}
        onChange={(e) => patch({ name: e.target.value })}
      />

      <select
        className={styles.select}
        value={form.type ?? 'planet'}
        onChange={(e) =>
          patch({ type: e.target.value as UniverseNodeType })
        }
      >
        {UNIVERSE_NODE_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      <div className={styles.formRow}>
        <input
          className={styles.colorInput}
          type="color"
          value={form.color}
          title="Barva tělesa"
          onChange={(e) => patch({ color: e.target.value })}
        />
        <input
          className={styles.input}
          type="number"
          min={1}
          placeholder="Velikost (5)"
          value={form.size}
          onChange={(e) => patch({ size: Number(e.target.value) })}
        />
      </div>

      <NamedColorPalette
        value={form.color}
        onPick={(hex) => patch({ color: hex })}
      />

      <input
        className={styles.input}
        type="text"
        placeholder="Frakce (volitelně)"
        value={form.alliance ?? ''}
        onChange={(e) => patch({ alliance: e.target.value })}
      />

      <label className={styles.checkRow}>
        <input
          type="checkbox"
          checked={form.hasRing ?? false}
          onChange={(e) => patch({ hasRing: e.target.checked })}
        />
        <span>Prsten kolem tělesa</span>
      </label>

      {/* obrázek */}
      {form.img && <img className={styles.thumb} src={form.img} alt="" />}
      <div className={styles.formRow}>
        <label className={styles.btn}>
          {upload.isPending ? 'Nahrávám…' : '🖼 Nahrát obrázek'}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
            }}
          />
        </label>
        {form.img && (
          <button
            type="button"
            className={`${styles.btn} ${styles.btnDanger}`}
            onClick={() => patch({ img: undefined })}
          >
            Odebrat
          </button>
        )}
      </div>

      {/* wiki ref */}
      <span className={styles.hint}>Odkaz na wiki stránku (volitelně):</span>
      <PagePicker
        worldId={worldId}
        value={form.pageSlug ?? null}
        onChange={(slug) => patch({ pageSlug: slug ?? undefined })}
      />

      {/* viditelnost */}
      <VisibilityEditor
        worldId={worldId}
        value={{
          isPublic: form.isPublic,
          visibleToPlayerIds: form.visibleToPlayerIds,
        }}
        onChange={(v) => patch(v)}
      />

      <div className={styles.formRow}>
        <button type="button" className={styles.btn} onClick={submit}>
          {editingNode ? '✓ Uložit těleso' : '+ Přidat těleso'}
        </button>
        <button type="button" className={styles.btn} onClick={onCancel}>
          Zrušit
        </button>
      </div>
    </div>
  );
}
