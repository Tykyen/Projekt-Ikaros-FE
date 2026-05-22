import { Plus, Trash2 } from 'lucide-react';
import type { InfoBlock } from '../../../api/characters.types';
import s from './editors.module.css';

interface Props {
  blocks: InfoBlock[];
  onChange: (blocks: InfoBlock[]) => void;
}

/**
 * 8.1 — Editor info bloků postavy (`{label, value}` řádky). Sdílený pro
 * veřejnou i soukromou sekci profilu.
 */
export function InfoBlockEditor({ blocks, onChange }: Props) {
  const update = (index: number, patch: Partial<InfoBlock>) =>
    onChange(blocks.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  const remove = (index: number) =>
    onChange(blocks.filter((_, i) => i !== index));
  const add = () => onChange([...blocks, { label: '', value: '' }]);

  return (
    <div className={s.stack}>
      {blocks.length > 0 && (
        <div className={s.grid}>
          {blocks.map((block, i) => (
            <div key={i} className={s.gridRow}>
              <div className={s.gridRowHead}>
                <input
                  className={s.field}
                  value={block.label}
                  placeholder="Název údaje"
                  aria-label="Název údaje"
                  onChange={(e) => update(i, { label: e.target.value })}
                />
                <button
                  type="button"
                  className={s.iconBtn}
                  onClick={() => remove(i)}
                  title="Smazat údaj"
                  aria-label="Smazat údaj"
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </div>
              <input
                className={s.field}
                value={block.value}
                placeholder="Hodnota"
                aria-label="Hodnota údaje"
                onChange={(e) => update(i, { value: e.target.value })}
              />
            </div>
          ))}
        </div>
      )}
      <button type="button" className={s.addBtn} onClick={add}>
        <Plus size={13} aria-hidden /> Přidat údaj
      </button>
    </div>
  );
}
