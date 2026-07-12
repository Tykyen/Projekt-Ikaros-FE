import { useState } from 'react';
import { Modal, Button, Input } from '@/shared/ui';
import type { AdminUsersListItem } from '@/shared/types';
import { parseApiError, parseApiErrorCode } from '@/shared/api/client';
import { useAdminUpdateUserEmail } from '../../api/useAdminUsers';
import s from './AdminChangeEmailModal.module.css';

interface Props {
  target: AdminUsersListItem | null;
  onClose: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * D-NEW-INV-ADMIN-UI — změna e-mailu uživatele (Superadmin-only,
 * `PATCH /admin/users/:id/email`). Prefill současné adresy; BE chyby
 * `SAME_EMAIL` (400) / `EMAIL_TAKEN` (409) se mapují na field-level hlášky
 * (vzor ChangeEmailModal v profilu), zbytek (403 SELF_MODIFICATION…) do
 * banneru. Nová adresa je na BE označena jako neověřená.
 */
export function AdminChangeEmailModal({ target, onClose }: Props) {
  const updateEmail = useAdminUpdateUserEmail();
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [banner, setBanner] = useState<string | null>(null);

  // Otevření pro nový cíl → prefill současného e-mailu + čistý stav.
  // Adjustment-during-render (ne effect — vzor UserAvatar FIX-2).
  const [prevTargetId, setPrevTargetId] = useState<string | null>(null);
  const targetId = target?.id ?? null;
  if (targetId !== prevTargetId) {
    setPrevTargetId(targetId);
    if (target) {
      setEmail(target.email);
      setFieldError(undefined);
      setBanner(null);
    }
  }

  const normalized = email.trim().toLowerCase();
  // Zrcadlí BE check `SAME_EMAIL` — dokud se adresa nezměnila, není co uložit.
  const unchanged = !!target && normalized === target.email.toLowerCase();

  async function onSubmit() {
    if (!target) return;
    setBanner(null);
    if (!EMAIL_RE.test(email.trim())) {
      setFieldError('Zadej platný e-mail');
      return;
    }
    try {
      await updateEmail.mutateAsync({ userId: target.id, email: email.trim() });
      onClose();
    } catch (err) {
      const code = parseApiErrorCode(err);
      if (code === 'SAME_EMAIL') {
        setFieldError('Nový e-mail je stejný jako aktuální');
      } else if (code === 'EMAIL_TAKEN') {
        setFieldError('Tento e-mail už používá jiný uživatel');
      } else {
        // 403 SELF_MODIFICATION / EMAIL_CHANGE_REQUIRES_SUPERADMIN, 404…
        setBanner(parseApiError(err));
      }
    }
  }

  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title={target ? `Změnit e-mail — ${target.username}` : 'Změnit e-mail'}
      size="md"
      footer={
        <div className={s.footer}>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={updateEmail.isPending}
          >
            Zrušit
          </Button>
          <Button
            variant="primary"
            onClick={onSubmit}
            loading={updateEmail.isPending}
            disabled={unchanged}
            title={unchanged ? 'Adresa se nezměnila' : undefined}
          >
            Změnit e-mail
          </Button>
        </div>
      }
    >
      {target && (
        <div className={s.body}>
          <div className={s.currentRow}>
            <span className={s.currentLabel}>Aktuální e-mail</span>
            <span className={s.currentValue}>{target.email}</span>
          </div>

          <Input
            label="Nový e-mail"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldError(undefined);
            }}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            inputMode="email"
            spellCheck={false}
            aria-invalid={fieldError ? 'true' : 'false'}
            error={fieldError}
          />

          <p className={s.note}>
            Změna proběhne okamžitě, bez potvrzovacího e-mailu — nová adresa
            bude označena jako <strong>neověřená</strong>.
          </p>

          {banner && (
            <p className={s.banner} role="alert" aria-live="polite">
              {banner}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
