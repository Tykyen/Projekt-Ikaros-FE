import { useState } from 'react';
import { toast } from 'sonner';
import { ImagePlus, Users, UserCircle } from 'lucide-react';
import clsx from 'clsx';
import { Button } from '@/shared/ui';
import { useUploadImage } from '@/shared/api';
import type { WorldSettings } from '@/shared/types';
import { useUpdateWorldSettings } from '@/features/world/api/useUpdateWorldSettings';
import s from './PjChatPersonaEditor.module.css';

type Mode = 'unified' | 'individual';

interface Props {
  worldId: string;
  settings: WorldSettings;
}

/**
 * 6.8 / 6.8-followup — politika vystupování vedení v chatu. PJ-only (mění celý
 * svět). `unified` = sdílená anonymní persona „PJ"; `individual` = každý z vedení
 * pod svou rolí + vlastním avatarem (ten si nastaví sám v „Můj obrázek vedení").
 * Render-time → projeví se zpětně.
 */
export function PjChatPersonaEditor({ worldId, settings }: Props) {
  const mutation = useUpdateWorldSettings(worldId);
  const uploadImage = useUploadImage();
  const persona = settings.pjChatPersona;
  const [mode, setMode] = useState<Mode>(persona?.mode ?? 'unified');
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
          // `enabled` držíme konzistentní s režimem kvůli zpětné kompatibilitě.
          enabled: mode === 'unified',
          mode,
          name: name.trim() || null,
          avatarUrl: avatarUrl || null,
        },
      });
      toast.success('Nastavení vedení uloženo.');
    } catch {
      toast.error('Uložení selhalo.');
    }
  }

  return (
    <div className={s.editor}>
      <div
        className={s.modeGroup}
        role="radiogroup"
        aria-label="Režim vystupování vedení"
      >
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'unified'}
          className={clsx(s.modeCard, mode === 'unified' && s.modeCardActive)}
          onClick={() => setMode('unified')}
        >
          <Users size={18} aria-hidden />
          <span className={s.modeName}>Anonymně</span>
          <span className={s.modeDesc}>
            Všichni z vedení vystupují jako jedno „PJ".
          </span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'individual'}
          className={clsx(s.modeCard, mode === 'individual' && s.modeCardActive)}
          onClick={() => setMode('individual')}
        >
          <UserCircle size={18} aria-hidden />
          <span className={s.modeName}>Rozpoznatelně</span>
          <span className={s.modeDesc}>
            Každý má svůj obrázek + svou roli (PJ / Pomocný PJ).
          </span>
        </button>
      </div>

      {mode === 'individual' ? (
        <p className={s.note}>
          Hráči uvidí, který konkrétní PJ jim píše — i zpětně u starších zpráv.
          Vlastní obrázek si každý z vedení nastaví níže v „Můj obrázek vedení".
        </p>
      ) : (
        <fieldset className={s.fields}>
          {/* Náhled jednotné persony v bublině chatu. */}
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
              <span className={s.previewTag}>takhle uvidí hráči zprávy vedení</span>
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
      )}

      <Button
        type="button"
        size="sm"
        loading={mutation.isPending}
        onClick={save}
      >
        Uložit režim vedení
      </Button>
    </div>
  );
}
