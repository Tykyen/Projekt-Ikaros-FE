import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button, Input, RoleStar, UserAvatar } from '@/shared/ui';
import { AvatarUploader } from './AvatarUploader';
import { ChangeEmailModal } from './ChangeEmailModal';
import {
  useUpdateProfile,
  useUploadAvatar,
  useDeleteAvatar,
} from '@/features/profile/api/useProfile';
import { useEmailVerifyResend } from '@/features/auth/api/useEmailVerify';
import { headerSchema, type HeaderForm } from '../lib/profileSchemas';
import { type User } from '@/shared/types';
import styles from './ProfileHeader.module.css';

const DATE_FMT = new Intl.DateTimeFormat('cs-CZ', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const DATETIME_FMT = new Intl.DateTimeFormat('cs-CZ', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  return DATE_FMT.format(new Date(iso));
}

function fmtDateTime(iso?: string | null): string {
  if (!iso) return '—';
  return DATETIME_FMT.format(new Date(iso));
}

interface Props {
  user: User;
}

/**
 * 1.3a — Header karta na profilu (z reference Matrix FE).
 * Pole: avatar, username, displayName, město, účet založen, poslední
 * přihlášení, barva chatu (swatch), globální motiv.
 * Edit mode: displayName, město + avatar uploader.
 * Email pole je read-only (změna v 1.7).
 */
export function ProfileHeader({ user }: Props) {
  const [editing, setEditing] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const update = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();
  const resendVerify = useEmailVerifyResend();

  async function handleResendVerify() {
    try {
      await resendVerify.mutateAsync();
      toast.success('Verifikační e-mail jsme znovu odeslali.');
    } catch {
      toast.error('Verifikační e-mail se nepodařilo odeslat.');
    }
  }

  const form = useForm<HeaderForm>({
    resolver: zodResolver(headerSchema),
    mode: 'onBlur',
    defaultValues: {
      displayName: user.displayName ?? '',
      city: user.city ?? '',
    },
  });

  async function onSubmit(values: HeaderForm) {
    await update.mutateAsync({
      displayName: values.displayName ?? '',
      city: values.city ?? '',
    });
    setEditing(false);
  }

  function cancel() {
    form.reset({
      displayName: user.displayName ?? '',
      city: user.city ?? '',
    });
    setEditing(false);
  }

  return (
    <article className={styles.card} data-frame-panel="card">
      <div className={styles.layout}>
        <div className={styles.avatarColumn}>
          {editing ? (
            <AvatarUploader
              currentUrl={user.avatarUrl}
              fallbackUrl={`/defaults/avatars/${user.defaultAvatarType}.webp`}
              isUploading={uploadAvatar.isPending}
              isDeleting={deleteAvatar.isPending}
              onUpload={(file) => uploadAvatar.mutateAsync(file)}
              onDelete={() => deleteAvatar.mutateAsync()}
              label="Avatar"
            />
          ) : (
            <UserAvatar
              src={user.avatarUrl}
              defaultType={user.defaultAvatarType}
              size="xl"
              alt={user.username}
            />
          )}
        </div>

        <div className={styles.fields}>
          <div className={styles.titleRow}>
            <h1 className={styles.username}>OSOBNÍ KARTA</h1>
            <RoleStar role={user.role} size="md" />
            {!editing && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setEditing(true)}
                className={styles.editBtn}
              >
                Upravit
              </Button>
            )}
          </div>

          {!editing ? (
            <dl className={styles.grid}>
              <Field label="Uživatelské jméno" value={user.username} />
              <Field
                label="Jméno"
                value={user.displayName || user.username}
              />
              <Field
                label="Email"
                value={
                  <span className={styles.emailRow}>
                    <span>{user.email}</span>
                    <EmailVerifyBadge
                      verified={user.emailVerified}
                      onResend={handleResendVerify}
                      resending={resendVerify.isPending}
                    />
                    <button
                      type="button"
                      className={styles.linkButton}
                      onClick={() => setEmailModalOpen(true)}
                    >
                      Změnit
                    </button>
                  </span>
                }
              />
              <Field label="Město" value={user.city || '—'} />
              <Field label="Účet založen" value={fmtDate(user.createdAt)} />
              <Field
                label="Poslední přihlášení"
                value={fmtDateTime(user.lastLoginAt)}
              />
              <Field
                label="Barva chatu"
                value={
                  <span className={styles.swatchRow}>
                    <span
                      className={styles.swatch}
                      style={{ backgroundColor: user.chatColor }}
                      aria-hidden="true"
                    />
                    <code>{user.chatColor.toUpperCase()}</code>
                  </span>
                }
              />
              <Field
                label="Globální motiv"
                value={user.themeId ?? 'Modré nebe (výchozí)'}
              />
            </dl>
          ) : (
            <form className={styles.editGrid} onSubmit={form.handleSubmit(onSubmit)}>
              <label className={styles.editField}>
                <span>Jméno</span>
                <Input
                  type="text"
                  maxLength={64}
                  {...form.register('displayName')}
                />
                {form.formState.errors.displayName && (
                  <em>{form.formState.errors.displayName.message}</em>
                )}
              </label>
              <label className={styles.editField}>
                <span>Město</span>
                <Input
                  type="text"
                  maxLength={100}
                  {...form.register('city')}
                />
                {form.formState.errors.city && (
                  <em>{form.formState.errors.city.message}</em>
                )}
              </label>
              <label className={styles.editField}>
                <span>E-mail</span>
                <div className={styles.emailEditRow}>
                  <Input type="email" value={user.email} readOnly disabled />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEmailModalOpen(true)}
                  >
                    Změnit e-mail
                  </Button>
                </div>
              </label>
              <div className={styles.editActions}>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={update.isPending}
                >
                  {update.isPending ? 'Ukládám…' : 'Uložit'}
                </Button>
                <Button type="button" variant="ghost" onClick={cancel}>
                  Zrušit
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      <ChangeEmailModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        currentEmail={user.email}
      />
    </article>
  );
}

function EmailVerifyBadge({
  verified,
  onResend,
  resending,
}: {
  verified: boolean;
  onResend: () => void;
  resending: boolean;
}) {
  if (verified) {
    return (
      <span
        className={styles.badge}
        data-variant="success"
        title="E-mail byl ověřen"
      >
        ✓ Ověřeno
      </span>
    );
  }
  return (
    <>
      <span
        className={styles.badge}
        data-variant="warning"
        title="E-mail zatím nebyl ověřen"
      >
        ⚠ Neověřeno
      </span>
      <button
        type="button"
        className={styles.linkButton}
        onClick={onResend}
        disabled={resending}
      >
        {resending ? 'Odesílám…' : 'Poslat znovu'}
      </button>
    </>
  );
}

function Field({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className={styles.fieldGroup}>
      <dt className={styles.fieldLabel}>{label}</dt>
      <dd className={styles.fieldValue}>{value}</dd>
      {hint && <small className={styles.fieldHint}>{hint}</small>}
    </div>
  );
}
