import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { Button, EditCard, Input } from '../../../components/ui';
import { useChangePassword } from '../../../api/hooks/useProfile';
import { passwordSchema, type PasswordForm } from './profileSchemas';
import styles from './ProfileSections.module.css';

/**
 * 1.3a — Sekce Bezpečnost.
 * - Změna hesla (vyžaduje staré heslo, BE revokuje refresh tokeny ostatních zařízení)
 * - Username pole disabled (přijde v 1.3b)
 */
export function SecuritySection({ username }: { username: string }) {
  const [editing, setEditing] = useState(false);
  const change = useChangePassword();

  const form = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    mode: 'onBlur',
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      newPasswordConfirm: '',
    },
  });

  async function onSubmit(values: PasswordForm) {
    try {
      await change.mutateAsync({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      form.reset();
      setEditing(false);
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 401) {
        form.setError('oldPassword', {
          message: 'Současné heslo je špatně',
        });
      } else {
        form.setError('root', {
          message: 'Nepodařilo se změnit heslo. Zkus to znovu.',
        });
      }
    }
  }

  function cancel() {
    form.reset();
  }

  return (
    <>
      <section className={styles.card}>
        <header className={styles.headerRow}>
          <h2 className={styles.sectionTitle}>Username</h2>
        </header>
        <div className={styles.disabledField}>
          <Input
            type="text"
            value={username}
            readOnly
            disabled
            title="Změna username bude dostupná v 1.3b (vyžaduje schválení adminem)"
          />
          <p className={styles.placeholderHint}>
            Změna username bude dostupná v 1.3b (schvaluje admin).
          </p>
        </div>
      </section>

      <EditCard
        title="Změna hesla"
        isEditing={editing}
        setEditing={setEditing}
        onSave={form.handleSubmit(onSubmit)}
        onCancel={cancel}
        isSaving={change.isPending}
        editView={
          <form
            className={styles.passwordForm}
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <label className={styles.editField}>
              <span>Současné heslo</span>
              <Input
                type="password"
                autoComplete="current-password"
                {...form.register('oldPassword')}
              />
              {form.formState.errors.oldPassword && (
                <em>{form.formState.errors.oldPassword.message}</em>
              )}
            </label>
            <label className={styles.editField}>
              <span>Nové heslo</span>
              <Input
                type="password"
                autoComplete="new-password"
                {...form.register('newPassword')}
              />
              {form.formState.errors.newPassword && (
                <em>{form.formState.errors.newPassword.message}</em>
              )}
            </label>
            <label className={styles.editField}>
              <span>Potvrzení nového hesla</span>
              <Input
                type="password"
                autoComplete="new-password"
                {...form.register('newPasswordConfirm')}
              />
              {form.formState.errors.newPasswordConfirm && (
                <em>{form.formState.errors.newPasswordConfirm.message}</em>
              )}
            </label>
            {form.formState.errors.root && (
              <p className={styles.error} role="alert">
                {form.formState.errors.root.message}
              </p>
            )}
            <Button type="submit" style={{ display: 'none' }}>
              submit hidden — EditCard má vlastní Save
            </Button>
          </form>
        }
      >
        <p className={styles.text}>
          Po změně hesla budou ostatní zařízení odhlášena.
        </p>
      </EditCard>
    </>
  );
}
