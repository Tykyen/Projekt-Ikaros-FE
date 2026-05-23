import { User, Lock, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import type { InfoBlock, PageType } from '../../api/pages.types';
import s from './PostavaPanel.module.css';

interface Props {
  type: PageType;
  ownerUserId: string;
  privateContent: string;
  privateInfoBlocks: InfoBlock[];
  onOwnerChange: (userId: string) => void;
  onPrivateContentChange: (html: string) => void;
  onPrivateInfoBlocksChange: (blocks: InfoBlock[]) => void;
}

/**
 * 9.1 — Editor PC/NPC pro PageEditor. Tři sekce:
 *
 *   1) Hráč postavy (jen PC) — select členů světa
 *   2) Soukromé bio (PJ + owner only) — rich-text + paralelní info-blocks
 *
 * Veřejné bio (`content`/`table`) řeší stávající ContentPanel + TablePanel —
 * tento panel je přidaný JEN pro postavu-specifické věci.
 */
export function PostavaPanel({
  type,
  ownerUserId,
  privateContent,
  privateInfoBlocks,
  onOwnerChange,
  onPrivateContentChange,
  onPrivateInfoBlocksChange,
}: Props) {
  const { worldId } = useWorldContext();
  const isPC = type === 'Postava hráče';
  const { data: members = [] } = useWorldMembers(worldId);

  function addBlock() {
    onPrivateInfoBlocksChange([...privateInfoBlocks, { label: '', value: '' }]);
  }

  function updateBlock(idx: number, patch: Partial<InfoBlock>) {
    onPrivateInfoBlocksChange(
      privateInfoBlocks.map((b, i) => (i === idx ? { ...b, ...patch } : b)),
    );
  }

  function removeBlock(idx: number) {
    onPrivateInfoBlocksChange(privateInfoBlocks.filter((_, i) => i !== idx));
  }

  function moveBlock(idx: number, direction: 'up' | 'down') {
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= privateInfoBlocks.length) return;
    const next = [...privateInfoBlocks];
    [next[idx], next[target]] = [next[target], next[idx]];
    onPrivateInfoBlocksChange(next);
  }

  return (
    <>
      {isPC && (
        <CollapsiblePanel
          title="Hráč postavy"
          icon={<User size={18} aria-hidden />}
        >
          <p className={s.hint}>
            Vyber člena světa, kterému postava patří. Hráč pak postavu uvidí
            v „Moje postava" a může editovat soukromou část bia.
          </p>
          <select
            value={ownerUserId}
            onChange={(e) => onOwnerChange(e.target.value)}
            className={s.select}
          >
            <option value="">— Bez přiřazení (zatím) —</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.user?.username ?? m.userId}
              </option>
            ))}
          </select>
        </CollapsiblePanel>
      )}

      <CollapsiblePanel
        title="Soukromé bio"
        icon={<Lock size={18} aria-hidden />}
      >
        <p className={s.hint}>
          Obsah viditelný jen PJ {isPC ? '+ hráč postavy' : '(NPC)'}. Hodí se
          na motivaci, tajemství, mechaniku.
        </p>

        {privateInfoBlocks.length > 0 && (
          <table className={s.blocks}>
            <thead>
              <tr>
                <th>Klíč</th>
                <th>Hodnota</th>
                <th aria-label="Akce" />
              </tr>
            </thead>
            <tbody>
              {privateInfoBlocks.map((b, i) => (
                <tr key={i}>
                  <td>
                    <input
                      type="text"
                      value={b.label}
                      onChange={(e) => updateBlock(i, { label: e.target.value })}
                      placeholder="Klíč"
                      className={s.cellInput}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={b.value}
                      onChange={(e) => updateBlock(i, { value: e.target.value })}
                      placeholder="Hodnota"
                      className={s.cellInput}
                    />
                  </td>
                  <td>
                    <div className={s.rowActions}>
                      <button
                        type="button"
                        onClick={() => moveBlock(i, 'up')}
                        disabled={i === 0}
                        aria-label={`Posunout řádek ${i + 1} nahoru`}
                        className={s.iconBtn}
                      >
                        <ArrowUp size={14} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(i, 'down')}
                        disabled={i === privateInfoBlocks.length - 1}
                        aria-label={`Posunout řádek ${i + 1} dolů`}
                        className={s.iconBtn}
                      >
                        <ArrowDown size={14} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlock(i)}
                        aria-label={`Smazat řádek ${i + 1}`}
                        className={s.removeBtn}
                      >
                        <Trash2 size={14} aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <button type="button" onClick={addBlock} className={s.addBtn}>
          <Plus size={14} aria-hidden /> Přidat soukromý řádek
        </button>

        <div className={s.contentWrap}>
          <label className={s.fieldLabel}>Soukromý text</label>
          <RichTextEditor
            value={privateContent}
            onChange={onPrivateContentChange}
            placeholder="Soukromé bio postavy…"
          />
        </div>
      </CollapsiblePanel>
    </>
  );
}
