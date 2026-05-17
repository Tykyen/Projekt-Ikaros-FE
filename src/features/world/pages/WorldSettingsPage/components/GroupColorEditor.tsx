import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui';
import type { WorldSettings } from '@/shared/types';
import { useUpdateWorldSettings } from '@/features/world/api/useUpdateWorldSettings';
import s from './GroupColorEditor.module.css';

interface GroupRow {
  name: string;
  color: string;
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
  const [rows, setRows] = useState<GroupRow[]>(() =>
    settings.customGroups.map((name) => ({
      name,
      color: settings.groupColors[name] ?? DEFAULT_COLOR,
    })),
  );
  const [newName, setNewName] = useState('');

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
