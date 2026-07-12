import { useState } from 'react';
import { toast } from 'sonner';
import { Modal, Button, Input } from '@/shared/ui';
import type { AdminUsersListItem } from '@/shared/types';
import { useAdminResetPassword } from '../../api/useAdminUsers';
import { generateTempPassword } from '../../lib/generateTempPassword';
import s from './ResetPasswordModal.module.css';

interface Props {
  target: AdminUsersListItem | null;
  onClose: () => void;
}

/**
 * D-NEW-INV-ADMIN-UI — reset hesla uživatele (Superadmin-only,
 * `PUT /users/:id/reset-password`). BE heslo negeneruje ani nevrací (204) —
 * dočasné heslo generuje FE (editovatelné), admin ho po nastavení zkopíruje
 * a předá uživateli. Po zavření už heslo nikde neuvidí.
 */
export function ResetPasswordModal({ target, onClose }: Props) {
  const reset = useAdminResetPassword();
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [touched, setTouched] = useState(false);

  // Otevření pro nový cíl → čerstvě vygenerované heslo + čistý stav.
  // Adjustment-during-render (ne effect — vzor UserAvatar FIX-2).
  const [prevTargetId, setPrevTargetId] = useState<string | null>(null);
  const targetId = target?.id ?? null;
  if (targetId !== prevTargetId) {
    setPrevTargetId(targetId);
    if (target) {
      setPassword(generateTempPassword());
      setDone(false);
      setTouched(false);
    }
  }

  const trimmed = password.trim();
  // Zrcadlí BE `ResetPasswordDto` (@MinLength(8) @MaxLength(128)).
  const lengthError =
    trimmed.length < 8
      ? 'Heslo musí mít alespoň 8 znaků'
      : trimmed.length > 128
        ? 'Heslo může mít nejvýše 128 znaků'
        : undefined;

  function copy() {
    void navigator.clipboard
      ?.writeText(trimmed)
      .then(() => toast.success('Heslo zkopírováno'));
  }

  async function onSubmit() {
    setTouched(true);
    if (!target || lengthError) return;
    await reset.mutateAsync({ userId: target.id, newPassword: trimmed });
    setDone(true);
  }

  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title={target ? `Reset hesla — ${target.username}` : 'Reset hesla'}
      size="md"
      footer={
        <div className={s.footer}>
          {done ? (
            <Button variant="primary" onClick={onClose}>
              Zavřít
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={reset.isPending}
              >
                Zrušit
              </Button>
              <Button
                variant="primary"
                onClick={onSubmit}
                loading={reset.isPending}
                disabled={touched && !!lengthError}
              >
                Nastavit heslo
              </Button>
            </>
          )}
        </div>
      }
    >
      {target && (
        <div className={s.body}>
          {done ? (
            <p className={s.success}>
              ✓ Heslo nastaveno. Zkopíruj ho teď a předej uživateli{' '}
              <strong>{target.username}</strong> bezpečným kanálem — po zavření
              už ho neuvidíš.
            </p>
          ) : (
            <p className={s.intro}>
              Nastavíš nové heslo pro uživatele{' '}
              <strong>{target.username}</strong>. Uživatel o změně nedostane
              e-mail — heslo mu předej sám bezpečným kanálem.
            </p>
          )}

          <div className={s.passwordRow}>
            <Input
              label="Nové heslo"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setTouched(true);
              }}
              readOnly={done}
              autoComplete="off"
              spellCheck={false}
              error={touched && !done ? lengthError : undefined}
              className={s.passwordInput}
            />
            <div className={s.passwordActions}>
              {!done && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPassword(generateTempPassword())}
                  disabled={reset.isPending}
                >
                  ↻ Vygenerovat
                </Button>
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={copy}
              >
                ⧉ Zkopírovat
              </Button>
            </div>
          </div>

          {!done && (
            <p className={s.warning}>
              ⚠ Reset okamžitě přepíše současné heslo uživatele.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
