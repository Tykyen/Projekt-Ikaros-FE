import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Modal, Button, Input } from '@/shared/ui';
import { parseApiError } from '@/shared/api/client';
import { useUploadContentImage } from '@/features/ikaros/api/useUploadContentImage';
import { useCreateGroup } from '../api/useChannelMutations';
import s from './CreateDialogs.module.css';

interface CreateGroupDialogProps {
  worldId: string;
  onClose: () => void;
}

/** Dialog „Nový kanál" — založení `ChatGroup` (PJ). Mountuje se až při otevření. */
export function CreateGroupDialog({
  worldId,
  onClose,
}: CreateGroupDialogProps) {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const createGroup = useCreateGroup(worldId);
  const uploadImage = useUploadContentImage();
  const busy = createGroup.isPending || uploadImage.isPending;

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    try {
      let imageUrl: string | undefined;
      if (file) imageUrl = (await uploadImage.mutateAsync(file)).url;
      await createGroup.mutateAsync({ name: trimmed, imageUrl });
      toast.success('Kanál vytvořen');
      onClose();
    } catch (err) {
      toast.error(`Vytvoření selhalo: ${parseApiError(err)}`);
    }
  };

  return (
    <Modal
      open
      onClose={busy ? () => {} : onClose}
      title="Nový kanál"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Zrušit
          </Button>
          <Button onClick={submit} disabled={busy || !name.trim()}>
            Vytvořit
          </Button>
        </>
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
              {file ? 'Změnit obrázek' : 'Nahrát obrázek'}
            </Button>
            {file && (
              <Button
                variant="ghost"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
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
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              setPreview(f ? URL.createObjectURL(f) : null);
            }}
          />
        </div>
      </div>
    </Modal>
  );
}
