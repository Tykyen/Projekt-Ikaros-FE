import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock } from 'lucide-react';
import { Button, Input } from '@/shared/ui';
import { parseApiErrorCode } from '@/shared/api';
import { EditCard } from './EditCard';
import { TotpCard } from './TotpCard';
import { TrustedDevicesCard } from './TrustedDevicesCard';
import { useMyProfile, useLogoutAll } from '@/features/auth/api/useAuth';
import { useChangePassword } from '@/features/profile/api/useProfile';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useMyUsernameRequest,
  useRequestUsernameChange,
  useCancelMyUsernameRequest,
} from '@/features/admin/users/api/useAdminUsers';
import {
  passwordSchema,
  usernameRequestSchema,
  type PasswordForm,
  type UsernameRequestForm,
} from '../lib/profileSchemas';
import { parseApiError } from '@/shared/api/client';
import styles from './ProfileSections.module.css';

const DEFAULT_COOLDOWN_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * 1.3a + 1.3b — Sekce Bezpečnost.
 * - 1.3b: Žádost o změnu username (schvalovací flow, cooldown 30d od posledního approve)
 * - Změna hesla (vyžaduje staré heslo, BE revokuje refresh tokeny ostatních zařízení)
 */
export function SecuritySection({ username }: { username: string }) {
  const [editingPassword, setEditingPassword] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);

  const navigate = useNavigate();
  const logoutAll = useLogoutAll();

  async function onLogoutAll() {
    try {
      await logoutAll.mutateAsync();
      toast.success('Odhlásili jsme tě ze všech zařízení.');
      navigate('/');
    } catch {
      toast.error('Odhlášení všech zařízení se nepovedlo. Zkus to znovu.');
    }
  }

  const change = useChangePassword();
  const { data: profile } = useMyProfile();
  const { data: requestData } = useMyUsernameRequest();
  const submitRequest = useRequestUsernameChange();
  const cancelRequest = useCancelMyUsernameRequest();

  const pendingRequest = requestData?.request ?? null;

  // Cooldown — 30 dní od posledního approved.
  // Date.now() impure → držíme tick v useState (lazy init OK) + interval refresh.
  // Compare v rendu pak používá tick místo Date.now() = pure.
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const cooldownDays =
    profile?.usernameChangeCooldownDays ?? DEFAULT_COOLDOWN_DAYS;
  const cooldownAllowedAt: Date | null = profile?.usernameChangedAt
    ? new Date(
        new Date(profile.usernameChangedAt).getTime() + cooldownDays * DAY_MS,
      )
    : null;
  const cooldownActive =
    cooldownAllowedAt !== null && cooldownAllowedAt.getTime() > tick;

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    mode: 'onBlur',
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      newPasswordConfirm: '',
    },
  });

  const usernameForm = useForm<UsernameRequestForm>({
    resolver: zodResolver(usernameRequestSchema),
    mode: 'onBlur',
    defaultValues: { requestedUsername: '' },
  });

  async function onSubmitPassword(values: PasswordForm) {
    try {
      await change.mutateAsync({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      passwordForm.reset();
      setEditingPassword(false);
    } catch (err: unknown) {
      // EC-RUN-07-01 fix — BE `changePassword` vrací 400 `INVALID_PASSWORD`
      // (FIX-50), ne 401 → čteme přes doménový kód (vzor ChangeEmailModal),
      // jinak field-hláška „heslo špatně" nikdy nenaskočí.
      if (parseApiErrorCode(err) === 'INVALID_PASSWORD') {
        passwordForm.setError('oldPassword', {
          message: 'Současné heslo je špatně',
        });
      } else {
        passwordForm.setError('root', {
          message: 'Nepodařilo se změnit heslo. Zkus to znovu.',
        });
      }
    }
  }

  async function onSubmitUsername(values: UsernameRequestForm) {
    try {
      await submitRequest.mutateAsync(values.requestedUsername);
      usernameForm.reset();
      setEditingUsername(false);
    } catch (err: unknown) {
      usernameForm.setError('requestedUsername', {
        message: parseApiError(err),
      });
    }
  }

  function cancelUsernameEdit() {
    usernameForm.reset();
    setEditingUsername(false);
  }

  return (
    <>
      <section className={styles.card}>
        <header className={styles.headerRow}>
          <h2 className={styles.sectionTitle}>Username</h2>
        </header>

        <div className={styles.usernameBlock}>
          <div className={styles.usernameCurrent}>
            <span className={styles.usernameCurrentLabel}>Aktuální</span>
            <span className={styles.usernameCurrentValue}>{username}</span>
          </div>

          {pendingRequest && (
            <div className={styles.pendingBanner} role="status">
              <div className={styles.pendingBannerHeader}>
                <Clock size={16} aria-hidden="true" />
                <span>
                  Žádost o změnu na{' '}
                  <span className={styles.pendingBannerTarget}>
                    {pendingRequest.requestedUsername}
                  </span>{' '}
                  čeká na schválení
                </span>
              </div>
              <p className={styles.pendingBannerMeta}>
                Podáno: {formatDate(pendingRequest.requestedAt)}
              </p>
              <div className={styles.pendingBannerActions}>
                <Button
                  variant="secondary"
                  onClick={() => cancelRequest.mutate()}
                  disabled={cancelRequest.isPending}
                >
                  Zrušit žádost
                </Button>
              </div>
            </div>
          )}

          {!pendingRequest && cooldownActive && cooldownAllowedAt && (
            <p className={styles.cooldownHint}>
              Další žádost o změnu username můžeš podat po{' '}
              {formatDate(cooldownAllowedAt.toISOString())}.
            </p>
          )}

          {!pendingRequest && !cooldownActive && !editingUsername && (
            <div>
              <Button onClick={() => setEditingUsername(true)}>
                Požádat o změnu username
              </Button>
            </div>
          )}

          {editingUsername && (
            <form
              className={styles.usernameRequestForm}
              onSubmit={usernameForm.handleSubmit(onSubmitUsername)}
            >
              <label className={styles.editField}>
                <span>Nové username</span>
                <Input
                  type="text"
                  autoComplete="off"
                  placeholder="napr. tykytanjr"
                  {...usernameForm.register('requestedUsername')}
                />
                {usernameForm.formState.errors.requestedUsername && (
                  <em>
                    {usernameForm.formState.errors.requestedUsername.message}
                  </em>
                )}
              </label>
              <p className={styles.cooldownHint}>
                Žádost schvaluje admin. Po schválení nelze username měnit
                dalších {cooldownDays} dní.
              </p>
              <div className={styles.usernameRequestActions}>
                <Button type="submit" disabled={submitRequest.isPending}>
                  Odeslat žádost
                </Button>
                <Button variant="secondary" onClick={cancelUsernameEdit}>
                  Zrušit
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>

      <EditCard
        title="Změna hesla"
        isEditing={editingPassword}
        setEditing={setEditingPassword}
        onSave={passwordForm.handleSubmit(onSubmitPassword)}
        onCancel={() => passwordForm.reset()}
        isSaving={change.isPending}
        editView={
          <form
            className={styles.passwordForm}
            onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
          >
            <label className={styles.editField}>
              <span>Současné heslo</span>
              <Input
                type="password"
                autoComplete="current-password"
                {...passwordForm.register('oldPassword')}
              />
              {passwordForm.formState.errors.oldPassword && (
                <em>{passwordForm.formState.errors.oldPassword.message}</em>
              )}
            </label>
            <label className={styles.editField}>
              <span>Nové heslo</span>
              <Input
                type="password"
                autoComplete="new-password"
                {...passwordForm.register('newPassword')}
              />
              {passwordForm.formState.errors.newPassword && (
                <em>{passwordForm.formState.errors.newPassword.message}</em>
              )}
            </label>
            <label className={styles.editField}>
              <span>Potvrzení nového hesla</span>
              <Input
                type="password"
                autoComplete="new-password"
                {...passwordForm.register('newPasswordConfirm')}
              />
              {passwordForm.formState.errors.newPasswordConfirm && (
                <em>
                  {passwordForm.formState.errors.newPasswordConfirm.message}
                </em>
              )}
            </label>
            {passwordForm.formState.errors.root && (
              <p className={styles.error} role="alert">
                {passwordForm.formState.errors.root.message}
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

      <TotpCard />
      <TrustedDevicesCard />

      {/* PT-35e follow-up — globální revokace všech relací (tokenVersion bump). */}
      <section className={styles.card}>
        <header className={styles.headerRow}>
          <h2 className={styles.sectionTitle}>Aktivní relace</h2>
        </header>
        <p className={styles.text}>
          Pokud máš podezření, že se k tvému účtu dostal někdo cizí, odhlas se
          naráz ze všech zařízení. Odhlásí to i tuto relaci — poté se přihlásíš
          znovu.
        </p>
        <div>
          <Button
            variant="secondary"
            onClick={onLogoutAll}
            disabled={logoutAll.isPending}
          >
            {logoutAll.isPending ? 'Odhlašuji…' : 'Odhlásit se ze všech zařízení'}
          </Button>
        </div>
      </section>
    </>
  );
}
