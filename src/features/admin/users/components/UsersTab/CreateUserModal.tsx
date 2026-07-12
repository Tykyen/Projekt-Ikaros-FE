import { useState } from 'react';
import { toast } from 'sonner';
import { useAtomValue } from 'jotai';
import { Modal, Button, Input } from '@/shared/ui';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import { ROLE_LABELS, ASSIGNABLE_ROLES } from '@/shared/types/userRoleLabels';
import { parseApiError, parseApiErrorCode } from '@/shared/api/client';
import { useAdminCreateUser } from '../../api/useAdminUsers';
import { generateTempPassword } from '../../lib/generateTempPassword';
import s from './CreateUserModal.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface FieldErrors {
  username?: string;
  email?: string;
  password?: string;
}

// Zrcadlí BE `CreateUserAdminDto`: @IsEmail / username 3–32 / password 8–128.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: {
  username: string;
  email: string;
  password: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const username = values.username.trim();
  if (username.length < 3 || username.length > 32) {
    errors.username = 'Přezdívka musí mít 3–32 znaků';
  }
  if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = 'Zadej platný e-mail';
  }
  if (values.password.length < 8) {
    errors.password = 'Heslo musí mít alespoň 8 znaků';
  } else if (values.password.length > 128) {
    errors.password = 'Heslo může mít nejvýše 128 znaků';
  }
  return errors;
}

/**
 * D-NEW-INV-ADMIN-UI — založení uživatele adminem (`POST /admin/users`).
 * Validace zrcadlí BE `CreateUserAdminDto`; `EMAIL_TAKEN`/`USERNAME_TAKEN`
 * se mapují na field-level chyby (vzor RegisterModal). Role hierarchie:
 * Admin nesmí zakládat admin role (BE `assertCanChangeRole`) → select
 * je nabízí jen Superadminovi.
 */
export function CreateUserModal({ open, onClose }: Props) {
  const currentUser = useAtomValue(currentUserAtom);
  const create = useAdminCreateUser();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(() => generateTempPassword());
  const [role, setRole] = useState<UserRole>(UserRole.Ikarus);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);

  const isSuperadmin = currentUser?.role === UserRole.Superadmin;
  // BE hierarchie: Admin nesmí přiřadit Superadmin/Admin (INSUFFICIENT_ROLE).
  const roleOptions = ASSIGNABLE_ROLES.filter(
    (r) =>
      isSuperadmin || (r !== UserRole.Superadmin && r !== UserRole.Admin),
  );

  function resetForm() {
    setUsername('');
    setEmail('');
    setPassword(generateTempPassword());
    setRole(UserRole.Ikarus);
    setErrors({});
    setBanner(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function copyPassword() {
    void navigator.clipboard
      ?.writeText(password)
      .then(() => toast.success('Heslo zkopírováno'));
  }

  async function onSubmit() {
    setBanner(null);
    const values = { username, email, password };
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await create.mutateAsync({
        username: username.trim(),
        email: email.trim(),
        password,
        role,
      });
      handleClose();
    } catch (err) {
      const code = parseApiErrorCode(err);
      if (code === 'EMAIL_TAKEN') {
        setErrors({ email: 'Tento e-mail už je registrovaný.' });
      } else if (code === 'USERNAME_TAKEN') {
        setErrors({ username: 'Tato přezdívka už je obsazená.' });
      } else {
        // Jiné chyby (403 hierarchie, 400 validace…) — BE hlášky jsou česky.
        setBanner(parseApiError(err));
      }
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nový uživatel"
      size="md"
      footer={
        <div className={s.footer}>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={create.isPending}
          >
            Zrušit
          </Button>
          <Button
            variant="primary"
            onClick={onSubmit}
            loading={create.isPending}
          >
            Vytvořit uživatele
          </Button>
        </div>
      }
    >
      <div className={s.body}>
        <p className={s.intro}>
          Účet vznikne rovnou aktivní (bez registračního e-mailu). Heslo předej
          uživateli bezpečným kanálem.
        </p>

        <Input
          label="Přezdívka"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setErrors((prev) => ({ ...prev, username: undefined }));
          }}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={errors.username ? 'true' : 'false'}
          error={errors.username}
        />

        <Input
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          inputMode="email"
          spellCheck={false}
          aria-invalid={errors.email ? 'true' : 'false'}
          error={errors.email}
        />

        <div className={s.passwordRow}>
          <Input
            label="Heslo"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={errors.password ? 'true' : 'false'}
            error={errors.password}
            className={s.passwordInput}
          />
          <div className={s.passwordActions}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setPassword(generateTempPassword());
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              disabled={create.isPending}
            >
              ↻ Vygenerovat
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={copyPassword}
            >
              ⧉ Zkopírovat
            </Button>
          </div>
        </div>

        <label className={s.field}>
          <span>Role</span>
          <select
            className={s.select}
            value={role}
            onChange={(e) => setRole(Number(e.target.value) as UserRole)}
          >
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>

        {banner && (
          <p className={s.banner} role="alert" aria-live="polite">
            {banner}
          </p>
        )}
      </div>
    </Modal>
  );
}
