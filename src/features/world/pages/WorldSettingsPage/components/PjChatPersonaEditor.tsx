import { useState } from 'react';
import { toast } from 'sonner';
import { ImagePlus, Theater } from 'lucide-react';
import { Button } from '@/shared/ui';
import { useUploadImage } from '@/shared/api';
import type { WorldSettings } from '@/shared/types';
import { useUpdateWorldSettings } from '@/features/world/api/useUpdateWorldSettings';
import s from './PjChatPersonaEditor.module.css';

interface Props {
  worldId: string;
  settings: WorldSettings;
}

/**
 * 6.8 — editor PJ persony v chatu. Vedení světa (role ≥ PomocnyPJ) vystupuje
 * pod jednotnou identitou místo přihlašovacího jména. Ukládá přes
 * `PUT /worlds/:worldId/settings` (PJ+ gate). Render-time → projeví se zpětně.
 */
export function PjChatPersonaEditor({ worldId, settings }: Props) {
  const mutation = useUpdateWorldSettings(worldId);
  const uploadImage = useUploadImage();
  const persona = settings.pjChatPersona;
  const [enabled, setEnabled] = useState(persona?.enabled ?? true);
  const [name, setName] = useState(persona?.name ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    persona?.avatarUrl ?? null,
  );
  const [uploading, setUploading] = useState(false);

  const label = name.trim() || 'PJ';

  async function pickAvatar(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadImage.mutateAsync(file);
      setAvatarUrl(url);
    } catch {
      toast.error('Nahrání avatara selhalo.');
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    try {
      await mutation.mutateAsync({
        pjChatPersona: {
          enabled,
          name: name.trim() || null,
          avatarUrl: avatarUrl || null,
        },
      });
      toast.success('PJ identita uložena.');
    } catch {
      toast.error('Uložení selhalo.');
    }
  }

  return (
    <div className={s.editor}>
      <label className={s.toggle}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        <span>Vedení vystupuje v chatu jako „PJ"</span>
      </label>

      <fieldset className={s.fields} disabled={!enabled}>
        {/* Náhled, jak persona vypadá v bublině chatu. */}
        <div className={s.preview}>
          <span className={s.avatar} aria-hidden>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" />
            ) : (
              label.slice(0, 1).toUpperCase()
            )}
          </span>
          <div className={s.previewMeta}>
            <span className={s.previewName}>{label}</span>
            <span className={s.previewTag}>
              <Theater size={11} aria-hidden /> takhle uvidí hráči zprávy vedení
            </span>
          </div>
        </div>

        <label className={s.field}>
          <span className={s.fieldLabel}>Jméno persony</span>
          <input
            type="text"
            className={s.input}
            value={name}
            placeholder="PJ"
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
          />
          <span className={s.hint}>Prázdné → zobrazí se „PJ".</span>
        </label>

        <div className={s.field}>
          <span className={s.fieldLabel}>Avatar persony</span>
          <div className={s.avatarRow}>
            <label className={s.avatarPick} title="Nahrát avatar">
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
                Odebrat avatar
              </Button>
            )}
          </div>
          <span className={s.hint}>Prázdné → kolečko s iniciálou.</span>
        </div>
      </fieldset>

      <Button
        type="button"
        size="sm"
        loading={mutation.isPending}
        onClick={save}
      >
        Uložit PJ identitu
      </Button>
    </div>
  );
}
