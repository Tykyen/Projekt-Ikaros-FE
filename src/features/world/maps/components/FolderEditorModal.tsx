import { useState } from 'react';
import { toast } from 'sonner';
import { Modal, Button } from '@/shared/ui';
import {
  useCreateWorldMapFolder,
  useUpdateWorldMapFolder,
} from '../api/useWorldMapFolderMutations';
import { MapVisibilityField } from './MapVisibilityField';
import type { WorldMapFolder } from '../types';
import s from './MapEditorModal.module.css';

interface Props {
  open: boolean;
  worldId: string;
  /** Editovaná složka; null = nová. */
  editing?: WorldMapFolder | null;
  folders: WorldMapFolder[];
  /** Rodič pro novou složku (= aktuálně otevřená složka). */
  defaultParentId: string | null;
  onClose: () => void;
}

/** 13.4b — modal pro vytvoření / úpravu složky atlasu (PJ+). */
export function FolderEditorModal({
  open,
  worldId,
  editing,
  folders,
  defaultParentId,
  onClose,
}: Props) {
  const isEdit = !!editing;
  const create = useCreateWorldMapFolder(worldId);
  const update = useUpdateWorldMapFolder(worldId);

  const [name, setName] = useState(editing?.name ?? '');
  const [parentId, setParentId] = useState<string | null>(
    editing?.parentId ?? defaultParentId ?? null,
  );
  const [isPublic, setIsPublic] = useState(editing?.isPublic ?? false);
  const [visibleToPlayerIds, setVisibleToPlayerIds] = useState<string[]>(
    editing?.visibleToPlayerIds ?? [],
  );

  const pending = create.isPending || update.isPending;
  const canSave = name.trim().length > 0;

  // Zakázat sebe + potomky jako rodiče (cyklus) — BE chrání taky.
  const blocked = new Set<string>();
  if (editing) {
    const stack: string[] = [editing.id];
    while (stack.length > 0) {
      const id = stack.pop();
      if (id === undefined) break;
      blocked.add(id);
      for (const f of folders) if (f.parentId === id) stack.push(f.id);
    }
  }
  const parentOptions = folders.filter((f) => !blocked.has(f.id));

  async function handleSave() {
    if (!canSave) {
      toast.error('Vyplň název složky.');
      return;
    }
    const payload = {
      name: name.trim(),
      parentId,
      isPublic,
      visibleToPlayerIds: isPublic ? [] : visibleToPlayerIds,
    };
    try {
      if (isEdit && editing) {
        await update.mutateAsync({ id: editing.id, patch: payload });
        toast.success('Složka upravena.');
      } else {
        await create.mutateAsync(payload);
        toast.success('Složka vytvořena.');
      }
      onClose();
    } catch {
      toast.error('Uložení složky selhalo.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Upravit složku' : 'Nová složka'}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Zrušit
          </Button>
          <Button
            onClick={() => void handleSave()}
            loading={pending}
            disabled={!canSave || pending}
          >
            {isEdit ? 'Uložit' : 'Vytvořit'}
          </Button>
        </>
      }
    >
      <div className={s.body}>
        <label className={s.row}>
          <span className={s.label}>Název *</span>
          <input
            type="text"
            className={s.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
            autoFocus
          />
        </label>

        <label className={s.row}>
          <span className={s.label}>Nadřazená složka</span>
          <select
            className={s.input}
            value={parentId ?? ''}
            onChange={(e) => setParentId(e.target.value || null)}
            data-native-select
          >
            <option value="">Kořen (Atlas)</option>
            {parentOptions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>

        <MapVisibilityField
          worldId={worldId}
          isPublic={isPublic}
          visibleToPlayerIds={visibleToPlayerIds}
          onChange={(v) => {
            setIsPublic(v.isPublic);
            setVisibleToPlayerIds(v.visibleToPlayerIds);
          }}
        />
      </div>
    </Modal>
  );
}
