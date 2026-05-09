import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, UserAvatar } from '@/shared/ui';
import { EditCard } from './EditCard';
import { AvatarUploader } from './AvatarUploader';
import {
  useUpdateProfile,
  useUploadCharacterAvatar,
  useDeleteCharacterAvatar,
} from '@/features/profile/api/useProfile';
import { characterSchema, type CharacterForm } from '../lib/profileSchemas';
import styles from './ProfileSections.module.css';

interface Props {
  characterName?: string | null;
  characterBio?: string | null;
  characterAvatarUrl?: string | null;
}

/**
 * 1.3a — Postava v Rozcestí (Ikaros chat).
 * Globální postava napříč Ikaros chaty (Hospoda + Rozcestí).
 * 3 pole: jméno, bio (1000), avatar (samostatný slot — 256×256 WebP).
 */
export function CharacterSection({
  characterName,
  characterBio,
  characterAvatarUrl,
}: Props) {
  const [editing, setEditing] = useState(false);
  const update = useUpdateProfile();
  const uploadAvatar = useUploadCharacterAvatar();
  const deleteAvatar = useDeleteCharacterAvatar();

  const form = useForm<CharacterForm>({
    resolver: zodResolver(characterSchema),
    defaultValues: {
      characterName: characterName ?? '',
      characterBio: characterBio ?? '',
    },
  });

  async function onSave() {
    const values = form.getValues();
    await update.mutateAsync({
      characterName: values.characterName ?? '',
      characterBio: values.characterBio ?? '',
    });
    setEditing(false);
  }

  function onCancel() {
    form.reset({
      characterName: characterName ?? '',
      characterBio: characterBio ?? '',
    });
  }

  const bioLen = (form.watch('characterBio') ?? '').length;

  return (
    <EditCard
      title="Postava v Rozcestí"
      isEditing={editing}
      setEditing={setEditing}
      onSave={onSave}
      onCancel={onCancel}
      isSaving={update.isPending}
      editView={
        <div className={styles.characterEdit}>
          <div className={styles.row}>
            <span className={styles.editLabel}>Avatar postavy</span>
            <AvatarUploader
              currentUrl={characterAvatarUrl}
              fallbackUrl="/defaults/avatars/being.webp"
              isUploading={uploadAvatar.isPending}
              isDeleting={deleteAvatar.isPending}
              onUpload={(file) => uploadAvatar.mutateAsync(file)}
              onDelete={() => deleteAvatar.mutateAsync()}
              label="Avatar postavy"
            />
          </div>
          <label className={styles.editField}>
            <span>Jméno postavy</span>
            <Input
              type="text"
              maxLength={64}
              {...form.register('characterName')}
            />
            {form.formState.errors.characterName && (
              <em>{form.formState.errors.characterName.message}</em>
            )}
          </label>
          <label className={styles.editField}>
            <span>Popis postavy</span>
            <textarea
              {...form.register('characterBio')}
              maxLength={1000}
              rows={6}
              className={styles.textarea}
              placeholder="Jak postava vypadá, co umí, co dělá v Rozcestí…"
            />
            <div className={styles.counter}>{bioLen} / 1000</div>
            {form.formState.errors.characterBio && (
              <em>{form.formState.errors.characterBio.message}</em>
            )}
          </label>
        </div>
      }
    >
      {characterName || characterBio || characterAvatarUrl ? (
        <div className={styles.characterRead}>
          <UserAvatar
            src={characterAvatarUrl}
            defaultType="being"
            size="lg"
            alt={characterName ?? 'Postava'}
          />
          <div className={styles.characterFields}>
            <h3 className={styles.characterName}>
              {characterName || 'Bezejmenná postava'}
            </h3>
            <p className={styles.text}>
              {characterBio || (
                <span className={styles.empty}>
                  Zatím bez popisu — uprav profil.
                </span>
              )}
            </p>
          </div>
        </div>
      ) : (
        <span className={styles.empty}>
          Postava ještě nebyla vytvořena. Klikni „Upravit" a přidej jméno,
          popis a avatar.
        </span>
      )}
    </EditCard>
  );
}
