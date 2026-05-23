import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Modal, Button, Input } from '@/shared/ui';
import { parseApiError } from '@/shared/api/client';
import { useUploadImage } from '@/shared/api';
import {
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
} from '../api/useChannelMutations';
import { groupColorVarFor } from '../lib/groupColor';
import { GroupColorPicker } from './GroupColorPicker';
import { GroupIconPicker } from './GroupIconPicker';
import type { ChatGroup } from '../lib/types';
import s from './CreateDialogs.module.css';

type Mode = 'create' | 'edit';

interface GroupDialogProps {
  worldId: string;
  mode: Mode;
  initial?: ChatGroup;
  onClose: () => void;
}

/** Dialog kanálu (`ChatGroup`) — create + edit + smazat (PJ/Pomocný PJ). */
export function GroupDialog({
  worldId,
  mode,
  initial,
  onClose,
}: GroupDialogProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    initial?.imageUrl ?? null,
  );
  const [removeImage, setRemoveImage] = useState(false);
  const [color, setColor] = useState<string | undefined>(initial?.color);
  const [iconKey, setIconKey] = useState<string | undefined>(initial?.iconKey);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const createGroup = useCreateGroup(worldId);
  const updateGroup = useUpdateGroup(worldId);
  const deleteGroup = useDeleteGroup(worldId);
  const uploadImage = useUploadImage();
  const busy =
    createGroup.isPending ||
    updateGroup.isPending ||
    deleteGroup.isPending ||
    uploadImage.isPending;

  const isEdit = mode === 'edit' && !!initial;

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    try {
      let uploadedUrl: string | undefined;
      if (file) uploadedUrl = (await uploadImage.mutateAsync(file)).url;

      if (mode === 'create') {
        await createGroup.mutateAsync({
          name: trimmed,
          imageUrl: uploadedUrl,
          color,
          iconKey,
        });
        toast.success('Kanál vytvořen');
      } else if (initial) {
        const dto: {
          groupId: string;
          name?: string;
          imageUrl?: string;
          color?: string;
          iconKey?: string;
        } = { groupId: initial.id };
        if (trimmed !== initial.name) dto.name = trimmed;
        if (uploadedUrl) dto.imageUrl = uploadedUrl;
        else if (removeImage) dto.imageUrl = '';
        // 6.5c — color a iconKey: prázdný string = reset (auto / bez ikony).
        if (color !== initial.color) dto.color = color ?? '';
        if (iconKey !== initial.iconKey) dto.iconKey = iconKey ?? '';
        await updateGroup.mutateAsync(dto);
        toast.success('Kanál uložen');
      }
      onClose();
    } catch (err) {
      toast.error(
        `${mode === 'create' ? 'Vytvoření' : 'Uložení'} selhalo: ${parseApiError(err)}`,
      );
    }
  };

  const handleDelete = async () => {
    if (!initial || busy) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    try {
      await deleteGroup.mutateAsync(initial.id);
      toast.success('Kanál smazán');
      onClose();
    } catch (err) {
      toast.error(`Smazání selhalo: ${parseApiError(err)}`);
    }
  };

  const pickedFile = (f: File | null) => {
    setFile(f);
    setRemoveImage(false);
    setPreview(f ? URL.createObjectURL(f) : (initial?.imageUrl ?? null));
  };

  const removeCurrent = () => {
    setFile(null);
    setPreview(null);
    setRemoveImage(true);
  };

  return (
    <Modal
      open
      onClose={busy ? () => {} : onClose}
      title={isEdit ? 'Upravit kanál' : 'Nový kanál'}
      footer={
        <div className={s.footer}>
          {isEdit && (
            <Button
              variant="ghost"
              onClick={handleDelete}
              disabled={busy}
              className={
                confirmingDelete ? s.deleteConfirm : s.deleteAction
              }
            >
              <Trash2 size={14} />
              {confirmingDelete ? 'Opravdu smazat?' : 'Smazat kanál'}
            </Button>
          )}
          <div className={s.footerRight}>
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              Zrušit
            </Button>
            <Button onClick={submit} disabled={busy || !name.trim()}>
              {isEdit ? 'Uložit' : 'Vytvořit'}
            </Button>
          </div>
        </div>
      }
    >
      <div className={s.form}>
        <label className={s.field}>
          <span className={s.label}>Název kanálu</span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="např. Evropani"
            maxLength={64}
            autoFocus
          />
        </label>

        <div className={s.field}>
          <span className={s.label}>Obrázek kanálu (volitelné)</span>
          <div className={s.imageRow}>
            {preview && (
              <img className={s.imagePreview} src={preview} alt="" />
            )}
            <Button
              variant="ghost"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
            >
              {preview ? 'Změnit obrázek' : 'Nahrát obrázek'}
            </Button>
            {preview && (
              <Button
                variant="ghost"
                onClick={removeCurrent}
                disabled={busy}
              >
                Odebrat
              </Button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => pickedFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className={s.field}>
          <span className={s.label}>Barva kanálu (volitelné)</span>
          <GroupColorPicker value={color} onChange={setColor} />
        </div>

        <div className={s.field}>
          <span className={s.label}>Ikona kanálu (volitelné)</span>
          <GroupIconPicker
            value={iconKey}
            onChange={setIconKey}
            accentColor={groupColorVarFor({ id: initial?.id ?? '', color })}
          />
          {preview && iconKey && (
            <p className={s.fieldWarn}>
              Obrázek přebije ikonu — v sidebaru se zobrazí obrázek.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
