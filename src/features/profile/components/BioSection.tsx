import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { EditCard } from './EditCard';
import { useUpdateProfile } from '@/features/profile/api/useProfile';
import { parseApiError } from '@/shared/api/client';
import { bioSchema, type BioForm } from '../lib/profileSchemas';
import styles from './ProfileSections.module.css';

interface Props {
  bio: string | null | undefined;
}

export function BioSection({ bio }: Props) {
  const [editing, setEditing] = useState(false);
  const update = useUpdateProfile();
  const form = useForm<BioForm>({
    resolver: zodResolver(bioSchema),
    defaultValues: { bio: bio ?? '' },
  });

  async function onSave() {
    const values = form.getValues();
    try {
      await update.mutateAsync({ bio: values.bio ?? '' });
      setEditing(false);
    } catch (err) {
      toast.error(parseApiError(err));
    }
  }

  function onCancel() {
    form.reset({ bio: bio ?? '' });
  }

  const value = useWatch({ control: form.control, name: 'bio' }) ?? '';

  return (
    <EditCard
      title="Něco o mně"
      isEditing={editing}
      setEditing={setEditing}
      onSave={onSave}
      onCancel={onCancel}
      isSaving={update.isPending}
      editView={
        <div className={styles.textareaWrapper}>
          <textarea
            {...form.register('bio')}
            maxLength={1000}
            rows={6}
            className={styles.textarea}
            placeholder="Napiš něco o sobě…"
          />
          <div className={styles.counter}>
            {value.length} / 1000
          </div>
          {form.formState.errors.bio && (
            <p className={styles.error}>
              {form.formState.errors.bio.message}
            </p>
          )}
        </div>
      }
    >
      {bio ? (
        <p className={styles.text}>{bio}</p>
      ) : (
        <span className={styles.empty}>Zatím nic nenapsáno.</span>
      )}
    </EditCard>
  );
}
