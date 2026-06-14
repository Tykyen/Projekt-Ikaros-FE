import { useState } from 'react';
import { toast } from 'sonner';
import { ImagePlus, Crown, Shield } from 'lucide-react';
import { Button } from '@/shared/ui';
import { useUploadImage } from '@/shared/api';
import { WorldRole } from '@/shared/types';
import { useUpdateMyPjAvatar } from '@/features/world/api/useUpdateMyPjAvatar';
import s from './PjChatPersonaEditor.module.css';

interface Props {
  worldId: string;
  /** Skutečná role člena (PJ / Pomocný PJ) — určuje zobrazený titulek. */
  role: WorldRole;
  /** Aktuální režim světa — řídí znění poznámky. */
  mode: 'unified' | 'individual';
  /** Aktuální avatar (z membershipu), null = nenastaveno. */
  currentAvatarUrl: string | null;
}

/**
 * 6.8-followup — self-service avatar vedení. Každý PJ/Pomocný PJ si nastaví
 * vlastní obrázek, pod kterým vystupuje v režimu „Rozpoznatelně". Titulek =
 * jeho role (nelze volit — vyplývá z pravomoci, mění se v záložce Členové).
 */
export function MyPjAvatarEditor({ worldId, role, mode, currentAvatarUrl }: Props) {
  const mutation = useUpdateMyPjAvatar(worldId);
  const uploadImage = useUploadImage();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl);
  const [uploading, setUploading] = useState(false);

  const isPJ = role >= WorldRole.PJ;
  const roleLabel = isPJ ? 'PJ' : 'Pomocný PJ';
  const RoleIcon = isPJ ? Crown : Shield;

  async function pickAvatar(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadImage.mutateAsync(file);
      setAvatarUrl(url);
    } catch {
      toast.error('Nahrání obrázku selhalo.');
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    try {
      await mutation.mutateAsync(avatarUrl);
      toast.success('Obrázek vedení uložen.');
    } catch {
      toast.error('Uložení selhalo.');
    }
  }

  return (
    <div className={s.editor}>
      <h3 className={s.subheading}>Můj obrázek vedení</h3>

      <div className={s.preview}>
        <span className={s.avatar} aria-hidden>
          {avatarUrl ? <img src={avatarUrl} alt="" /> : <RoleIcon size={18} />}
        </span>
        <div className={s.previewMeta}>
          <span className={s.previewName}>{roleLabel}</span>
          <span className={s.previewTag}>
            <RoleIcon size={11} aria-hidden />
            {mode === 'individual'
              ? 'takhle tě uvidí hráči v chatu'
              : 'svět je teď anonymní — projeví se po přepnutí na „Rozpoznatelně"'}
          </span>
        </div>
      </div>

      <div className={s.field}>
        <span className={s.fieldLabel}>Obrázek</span>
        <div className={s.avatarRow}>
          <label className={s.avatarPick} title="Nahrát obrázek">
            {uploading ? (
              '…'
            ) : avatarUrl ? (
              <img src={avatarUrl} alt="" />
            ) : (
              <ImagePlus size={18} aria-hidden />
            )}
            <input
              type="file"
              accept="image/*"
              hidden
              disabled={uploading}
              onChange={(e) => pickAvatar(e.target.files?.[0])}
            />
          </label>
          {avatarUrl && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setAvatarUrl(null)}
            >
              Odebrat obrázek
            </Button>
          )}
        </div>
        <span className={s.hint}>Prázdné → použije se obrázek tvého účtu.</span>
      </div>

      <Button
        type="button"
        size="sm"
        loading={mutation.isPending}
        onClick={save}
      >
        Uložit můj obrázek
      </Button>
    </div>
  );
}
