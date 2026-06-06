import { useState, type CSSProperties } from 'react';
import { toast } from 'sonner';
import { ImagePlus } from 'lucide-react';
import { Button } from '@/shared/ui';
import { useUploadImage } from '@/shared/api';
import type { WorldSettings } from '@/shared/types';
import { useUpdateWorldSettings } from '@/features/world/api/useUpdateWorldSettings';
import s from './GroupColorEditor.module.css';

interface GroupRow {
  name: string;
  color: string;
  /** Znak skupiny (emblém) — zrcadlí se do ikony chat kanálu. */
  image?: string;
}

interface Props {
  worldId: string;
  settings: WorldSettings;
}

/** Výchozí barva nové skupiny (datová hodnota, ne designový token). */
const DEFAULT_COLOR = '#888888'; // lint-colors-ignore

/**
 * 5.3c — správa skupin světa a jejich barev. Gated na PJ+ (ukládá přes
 * `PUT /worlds/:worldId/settings`). Barva odlišuje skupinu v chatu/seznamech.
 */
export function GroupColorEditor({ worldId, settings }: Props) {
  const mutation = useUpdateWorldSettings(worldId);
  const uploadImage = useUploadImage();
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [rows, setRows] = useState<GroupRow[]>(() => {
    // Defenzivní fallback — settings v cache může být starý záznam bez
    // customGroups/groupColors (před introduction polí) nebo fresh-empty
    // object z MembersTab fallbacku. Hlavně neházet `.map of undefined`.
    const groups = settings.customGroups ?? [];
    const colors = settings.groupColors ?? {};
    const images = settings.groupImages ?? {};
    return groups.map((name) => ({
      name,
      color: colors[name] ?? DEFAULT_COLOR,
      image: images[name],
    }));
  });
  const [newName, setNewName] = useState('');

  async function pickImage(idx: number, file: File | undefined) {
    if (!file) return;
    setUploadingIdx(idx);
    try {
      const { url } = await uploadImage.mutateAsync(file);
      setRows((prev) =>
        prev.map((r, i) => (i === idx ? { ...r, image: url } : r)),
      );
    } catch {
      toast.error('Nahrání znaku selhalo.');
    } finally {
      setUploadingIdx(null);
    }
  }

  function clearImage(idx: number) {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, image: undefined } : r)),
    );
  }

  function addGroup() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (rows.some((r) => r.name === trimmed)) {
      toast.error('Skupina s tímto názvem už existuje.');
      return;
    }
    setRows([...rows, { name: trimmed, color: DEFAULT_COLOR }]);
    setNewName('');
  }

  async function save() {
    try {
      await mutation.mutateAsync({
        customGroups: rows.map((r) => r.name),
        groupColors: Object.fromEntries(rows.map((r) => [r.name, r.color])),
        groupImages: Object.fromEntries(
          rows
            .filter((r) => r.image)
            .map((r) => [r.name, r.image as string]),
        ),
      });
      toast.success('Skupiny uloženy.');
    } catch {
      toast.error('Uložení skupin selhalo.');
    }
  }

  return (
    <div className={s.editor}>
      <div className={s.list}>
        {rows.length === 0 && (
          <p className={s.empty}>Zatím žádné skupiny.</p>
        )}
        {rows.map((row, idx) => (
          <div key={row.name} className={s.row}>
            <input
              type="color"
              className={s.color}
              value={row.color}
              aria-label={`Barva skupiny ${row.name}`}
              onChange={(e) => {
                const next = [...rows];
                next[idx] = { ...row, color: e.target.value };
                setRows(next);
              }}
            />
            <span
              className={s.emblem}
              style={{ '--g-ring': row.color } as CSSProperties}
            >
              <label
                className={s.emblemPick}
                title="Nahrát znak skupiny"
                aria-label={`Znak skupiny ${row.name}`}
              >
                {row.image ? (
                  <img className={s.emblemImg} src={row.image} alt="" />
                ) : (
                  <ImagePlus size={16} aria-hidden />
                )}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={uploadingIdx !== null}
                  onChange={(e) => pickImage(idx, e.target.files?.[0])}
                />
              </label>
              {row.image && (
                <button
                  type="button"
                  className={s.emblemClear}
                  onClick={() => clearImage(idx)}
                  aria-label={`Odebrat znak skupiny ${row.name}`}
                  title="Odebrat znak"
                >
                  ×
                </button>
              )}
            </span>
            <span className={s.name}>{row.name}</span>
            <button
              type="button"
              className={s.remove}
              onClick={() => setRows(rows.filter((_, i) => i !== idx))}
            >
              Smazat
            </button>
          </div>
        ))}
      </div>

      <div className={s.addRow}>
        <input
          type="text"
          className={s.addInput}
          value={newName}
          placeholder="Název nové skupiny…"
          maxLength={40}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addGroup();
            }
          }}
        />
        <Button type="button" variant="secondary" size="sm" onClick={addGroup}>
          Přidat
        </Button>
      </div>

      <Button
        type="button"
        size="sm"
        loading={mutation.isPending}
        onClick={save}
      >
        Uložit skupiny
      </Button>
    </div>
  );
}
