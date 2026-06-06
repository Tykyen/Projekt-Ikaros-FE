import { useState } from 'react';
import { toast } from 'sonner';
import { Modal, Button } from '@/shared/ui';
import { HeroUploadCard } from '@/features/world/pages/PageEditor/components/HeroUploadCard';
import {
  useCreateWorldMap,
  useUpdateWorldMap,
} from '../api/useWorldMapMutations';
import type { WorldMapEntry } from '../types';
import { MapVisibilityField } from './MapVisibilityField';
import s from './MapEditorModal.module.css';

interface Props {
  open: boolean;
  worldId: string;
  /** Editovaná mapa; null = nová. */
  editing?: WorldMapEntry | null;
  onClose: () => void;
}

/** 13.4 — modal pro přidání / úpravu mapy v atlasu (PJ+). */
export function MapEditorModal({ open, worldId, editing, onClose }: Props) {
  const isEdit = !!editing;
  const create = useCreateWorldMap(worldId);
  const update = useUpdateWorldMap(worldId);

  const [title, setTitle] = useState(editing?.title ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [imageUrl, setImageUrl] = useState(editing?.imageUrl ?? '');
  const [isPublic, setIsPublic] = useState(editing?.isPublic ?? false);
  const [visibleToPlayerIds, setVisibleToPlayerIds] = useState<string[]>(
    editing?.visibleToPlayerIds ?? [],
  );

  const pending = create.isPending || update.isPending;
  const canSave = title.trim().length > 0 && imageUrl.length > 0;

  async function handleSave() {
    if (!canSave) {
      toast.error('Vyplň název a nahraj obrázek mapy.');
      return;
    }
    const payload = {
      title: title.trim(),
      description: description.trim(),
      imageUrl,
      isPublic,
      visibleToPlayerIds: isPublic ? [] : visibleToPlayerIds,
    };
    try {
      if (isEdit && editing) {
        await update.mutateAsync({ id: editing.id, patch: payload });
        toast.success('Mapa upravena.');
      } else {
        await create.mutateAsync(payload);
        toast.success('Mapa přidána.');
      }
      onClose();
    } catch {
      toast.error('Uložení mapy selhalo.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Upravit mapu' : 'Nová mapa'}
      size="lg"
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
            {isEdit ? 'Uložit' : 'Přidat'}
          </Button>
        </>
      }
    >
      <div className={s.body}>
        <div className={s.row}>
          <span className={s.label}>Obrázek mapy *</span>
          <HeroUploadCard
            value={imageUrl}
            onChange={setImageUrl}
            compact
            uploadCta="Nahrát mapu"
          />
        </div>

        <label className={s.row}>
          <span className={s.label}>Název *</span>
          <input
            type="text"
            className={s.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            autoFocus
          />
        </label>

        <label className={s.row}>
          <span className={s.label}>Popis</span>
          <textarea
            className={s.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={2000}
          />
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
