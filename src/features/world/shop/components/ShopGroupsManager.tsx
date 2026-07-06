import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/shared/ui/Modal/Modal';
import { Button } from '@/shared/ui/Button/Button';
import { Input } from '@/shared/ui/Input/Input';
import { parseApiErrorCode } from '@/shared/api/client';
import {
  useCreateShopGroup,
  useUpdateShopGroup,
  useDeleteShopGroup,
} from '../api';
import type { ShopGroup } from '../types';
import s from './shop.module.css';

interface ShopGroupsManagerProps {
  worldId: string;
  groups: ShopGroup[];
  canShare: boolean;
  onClose: () => void;
}

interface RowState {
  name: string;
  discountPercent: number | '';
}

/** Spec 11.3 §5A.4 — správa typů / skupin (2 úrovně) + slevy na skupinu. */
export function ShopGroupsManager({
  worldId,
  groups,
  canShare,
  onClose,
}: ShopGroupsManagerProps) {
  const createM = useCreateShopGroup(worldId);
  const updateM = useUpdateShopGroup(worldId);
  const deleteM = useDeleteShopGroup(worldId);

  const topGroups = useMemo(() => groups.filter((g) => !g.parentId), [groups]);
  const childrenOf = (id: string) => groups.filter((g) => g.parentId === id);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<RowState>({ name: '', discountPercent: '' });

  // Nová skupina / podskupina
  const [newName, setNewName] = useState('');
  const [newDiscount, setNewDiscount] = useState<number | ''>('');
  const [newParentId, setNewParentId] = useState('');

  function add() {
    if (!newName.trim()) return;
    createM.mutate(
      {
        name: newName.trim(),
        parentId: newParentId || undefined,
        discountPercent: newDiscount === '' ? 0 : newDiscount,
        isShared: canShare ? true : undefined,
      },
      {
        onSuccess: () => {
          toast.success(`Skupina „${newName.trim()}" přidána.`);
          setNewName('');
          setNewDiscount('');
          setNewParentId('');
        },
        onError: () => toast.error('Přidání selhalo.'),
      },
    );
  }

  function startEdit(g: ShopGroup) {
    setEditingId(g.id);
    setEdit({ name: g.name, discountPercent: g.discountPercent || '' });
  }

  function saveEdit(g: ShopGroup) {
    updateM.mutate(
      {
        id: g.id,
        input: {
          name: edit.name.trim() || g.name,
          parentId: g.parentId,
          discountPercent: edit.discountPercent === '' ? 0 : edit.discountPercent,
        },
      },
      {
        onSuccess: () => {
          toast.success('Skupina uložena.');
          setEditingId(null);
        },
        onError: () => toast.error('Uložení selhalo.'),
      },
    );
  }

  function remove(g: ShopGroup) {
    deleteM.mutate(g.id, {
      onSuccess: () => toast.success(`Skupina „${g.name}" smazána.`),
      onError: (err) => {
        toast.error(
          parseApiErrorCode(err) === 'CAMPAIGN_SHOPGROUP_NOT_EMPTY'
            ? 'Skupina obsahuje položky nebo podskupiny — nejdřív je přesuň.'
            : 'Smazání selhalo.',
        );
      },
    });
  }

  function renderRow(g: ShopGroup, isChild: boolean) {
    const editing = editingId === g.id;
    return (
      <div
        key={g.id}
        className={`${s.groupRow} ${isChild ? s.groupRowChild : ''}`}
      >
        {editing ? (
          <>
            <input
              className={s.searchInput}
              value={edit.name}
              onChange={(e) => setEdit((p) => ({ ...p, name: e.target.value }))}
            />
            <input
              className={s.select}
              type="number"
              min={0}
              max={100}
              placeholder="sleva %"
              value={edit.discountPercent}
              onChange={(e) =>
                setEdit((p) => ({
                  ...p,
                  discountPercent:
                    e.target.value === '' ? '' : Number(e.target.value),
                }))
              }
            />
            <Button size="sm" onClick={() => saveEdit(g)}>
              Uložit
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
              Zrušit
            </Button>
          </>
        ) : (
          <>
            <span className={s.groupName}>{g.name}</span>
            {g.discountPercent > 0 && (
              <span className={s.groupDisc}>−{g.discountPercent} %</span>
            )}
            <button
              type="button"
              className={s.iconBtn}
              title="Upravit"
              onClick={() => startEdit(g)}
            >
              ✎
            </button>
            <button
              type="button"
              className={`${s.iconBtn} ${s.iconBtnDanger}`}
              title="Smazat"
              onClick={() => remove(g)}
            >
              ✕
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Spravovat typy / skupiny"
      size="md"
      footer={
        <Button variant="ghost" onClick={onClose}>
          Hotovo
        </Button>
      }
    >
      <div className={s.form}>
        <div className={s.groupTree}>
          {topGroups.length === 0 && (
            <p className={s.empty}>Zatím žádné skupiny.</p>
          )}
          {topGroups.map((g) => (
            <div key={g.id}>
              {renderRow(g, false)}
              {childrenOf(g.id).map((c) => renderRow(c, true))}
            </div>
          ))}
        </div>

        <div className={s.formRow}>
          <Input
            label="Nová skupina"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input
            label="Sleva %"
            type="number"
            min={0}
            max={100}
            value={newDiscount}
            onChange={(e) =>
              setNewDiscount(e.target.value === '' ? '' : Number(e.target.value))
            }
          />
          <label className={s.fieldLabel}>
            Rodič (= podskupina)
            <select
              className={s.select}
              value={newParentId}
              onChange={(e) => setNewParentId(e.target.value)}
            >
              <option value="">— top skupina —</option>
              {topGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Button onClick={add} loading={createM.isPending}>
          + Přidat skupinu
        </Button>
      </div>
    </Modal>
  );
}
