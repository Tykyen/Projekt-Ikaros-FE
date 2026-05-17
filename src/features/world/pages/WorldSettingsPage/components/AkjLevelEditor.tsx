import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui';
import type { AkjType } from '@/shared/types';
import { useUpdateAkjTypes } from '@/features/world/api/useUpdateAkjTypes';
import s from './AkjLevelEditor.module.css';

interface Props {
  worldId: string;
  initial: AkjType[];
}

function freshKey(): string {
  return `akj-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * 5.3d — editor AKJ úrovní. PJ/PomocnyPJ pojmenuje úrovně dle světa;
 * `level` řídí stupeň prověrky. Ukládá přes `useUpdateAkjTypes`.
 */
export function AkjLevelEditor({ worldId, initial }: Props) {
  const mutation = useUpdateAkjTypes(worldId);
  const [rows, setRows] = useState<AkjType[]>(() =>
    [...initial].sort((a, b) => a.level - b.level),
  );

  function update(idx: number, patch: Partial<AkjType>) {
    setRows(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function addLevel() {
    const nextLevel = rows.length
      ? Math.max(...rows.map((r) => r.level)) + 1
      : 0;
    setRows([...rows, { key: freshKey(), name: '', level: nextLevel }]);
  }

  async function save() {
    const cleaned = rows.map((r) => ({ ...r, name: r.name.trim() }));
    if (cleaned.some((r) => !r.name)) {
      toast.error('Každá úroveň musí mít název.');
      return;
    }
    try {
      await mutation.mutateAsync(cleaned);
      toast.success('AKJ úrovně uloženy.');
    } catch {
      toast.error('Uložení AKJ úrovní selhalo.');
    }
  }

  return (
    <div className={s.editor}>
      <div className={s.list}>
        {rows.length === 0 && (
          <p className={s.empty}>
            Zatím žádné AKJ úrovně. Přidej první úroveň.
          </p>
        )}
        {rows.map((row, idx) => (
          <div key={row.key} className={s.row}>
            <label className={s.levelCell}>
              <span className={s.cellLabel}>Stupeň</span>
              <input
                type="number"
                className={s.levelInput}
                min={0}
                value={row.level}
                onChange={(e) =>
                  update(idx, {
                    level: Math.max(0, Number(e.target.value) || 0),
                  })
                }
              />
            </label>
            <label className={s.nameCell}>
              <span className={s.cellLabel}>Název úrovně</span>
              <input
                type="text"
                className={s.nameInput}
                maxLength={60}
                placeholder="např. Veřejné, Tajný spis…"
                value={row.name}
                onChange={(e) => update(idx, { name: e.target.value })}
              />
            </label>
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

      <div className={s.actions}>
        <Button type="button" variant="secondary" size="sm" onClick={addLevel}>
          Přidat úroveň
        </Button>
        <Button
          type="button"
          size="sm"
          loading={mutation.isPending}
          onClick={save}
        >
          Uložit úrovně
        </Button>
      </div>
    </div>
  );
}
