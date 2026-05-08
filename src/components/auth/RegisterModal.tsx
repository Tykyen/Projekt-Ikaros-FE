import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAtom, useSetAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Modal } from '../ui/Modal/Modal';
import { Input } from '../ui/Input/Input';
import { Button } from '../ui/Button/Button';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { AvailabilityIcon, type AvailabilityStatus } from './AvailabilityIcon';
import { registerSchema, type RegisterFormValues } from './registerSchema';
import { useRegister } from '../../api/hooks/useAuth';
import { useCheckUsername, useCheckEmail } from '../../api/hooks/useAvailability';
import {
  registerModalOpenAtom,
  openLoginModalAtom,
} from '../../store/authStore';
import { parseApiErrorCode } from '../../api/client';
import s from './RegisterModal.module.css';

const LOGIN_INTENT_KEY = 'ikaros.loginIntent';

function mapErrorToBanner(error: unknown): string | null {
  if (!axios.isAxiosError(error)) return 'Registrace se nezdařila.';
  const status = error.response?.status;
  // Field-level chyby se zobrazí pod inputem, banner se neukáže
  if (status === 409) return null;
  if (status === 429)
    return 'Příliš mnoho pokusů. Zkus to znovu za chvíli.';
  if (status === undefined || status === 0)
    return 'Nepodařilo se připojit k serveru.';
  if (status >= 500) return 'Něco se pokazilo. Zkus to znovu.';
  if (status === 400) return 'Některá data nejsou platná.';
  return 'Registrace se nezdařila.';
}

function isSafeRedirect(target: string | null): target is string {
  if (!target) return false;
  return target.startsWith('/') && !target.startsWith('//');
}

function deriveStatus(
  query: ReturnType<typeof useCheckUsername>,
  enabled: boolean,
): AvailabilityStatus {
  if (!enabled) return 'idle';
  if (query.isFetching) return 'loading';
  if (query.data?.available === true) return 'available';
  if (query.data?.available === false) return 'unavailable';
  return 'idle';
}

export function RegisterModal() {
  const [open, setOpen] = useAtom(registerModalOpenAtom);
  const openLogin = useSetAtom(openLoginModalAtom);
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();
  const register = useRegister();

  const {
    register: rhfRegister,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    reset,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      username: '',
      password: '',
      passwordConfirm: '',
    },
  });

  const emailValue = watch('email');
  const usernameValue = watch('username');
  const passwordValue = watch('password');

  const usernameQuery = useCheckUsername(usernameValue);
  const emailQuery = useCheckEmail(emailValue);

  const usernameStatus = deriveStatus(
    usernameQuery,
    usernameValue.length >= 3 &&
      usernameValue.length <= 32 &&
      !usernameValue.includes('@'),
  );
  const emailStatus = deriveStatus(
    emailQuery,
    emailValue.length >= 5 &&
      emailValue.length <= 255 &&
      emailValue.includes('@'),
  );

  function close() {
    setOpen(false);
    setSubmitError(null);
    setShowPassword(false);
    reset();
  }

  function switchToLogin() {
    setSubmitError(null);
    setShowPassword(false);
    reset();
    openLogin();
  }

  async function onSubmit(values: RegisterFormValues) {
    setSubmitError(null);
    try {
      const result = await register.mutateAsync({
        email: values.email,
        username: values.username,
        password: values.password,
      });
      const intent = sessionStorage.getItem(LOGIN_INTENT_KEY);
      sessionStorage.removeItem(LOGIN_INTENT_KEY);

      const username = result.user.displayName ?? result.user.username;
      toast.success(`Vítej, ${username}! Účet vytvořen.`);
      close();

      navigate(isSafeRedirect(intent) ? intent : '/');
    } catch (err) {
      const code = parseApiErrorCode(err);
      if (code === 'EMAIL_TAKEN') {
        setError('email', {
          type: 'server',
          message: 'Tento e-mail už je registrovaný.',
        });
      } else if (code === 'USERNAME_TAKEN') {
        setError('username', {
          type: 'server',
          message: 'Tato přezdívka už je obsazená.',
        });
      } else {
        setSubmitError(mapErrorToBanner(err));
      }
    }
  }

  // Disable submit pokud BE už řekl, že hodnota není dostupná
  const blockedByAvailability =
    usernameStatus === 'unavailable' || emailStatus === 'unavailable';

  return (
    <Modal open={open} onClose={close} title="Registrace" size="md">
      <form className={s.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={s.fieldWrap}>
          <Input
            label="E-mail"
            type="email"
            autoFocus
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            inputMode="email"
            spellCheck={false}
            aria-invalid={errors.email ? 'true' : 'false'}
            error={errors.email?.message}
            {...rhfRegister('email')}
          />
          <span className={s.fieldIcon}>
            <AvailabilityIcon status={emailStatus} />
          </span>
        </div>

        <div className={s.fieldWrap}>
          <Input
            label="Přezdívka"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={errors.username ? 'true' : 'false'}
            error={errors.username?.message}
            {...rhfRegister('username')}
          />
          <span className={s.fieldIcon}>
            <AvailabilityIcon status={usernameStatus} />
          </span>
        </div>

        <div className={s.passwordWrap}>
          <Input
            label="Heslo"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            aria-invalid={errors.password ? 'true' : 'false'}
            error={errors.password?.message}
            {...rhfRegister('password')}
          />
          <button
            type="button"
            className={s.toggle}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Skrýt heslo' : 'Zobrazit heslo'}
            aria-pressed={showPassword}
            tabIndex={-1}
          >
            {showPassword ? '🙈' : '👁'}
          </button>
        </div>
        <PasswordStrengthIndicator password={passwordValue} />

        <div className={s.passwordWrap}>
          <Input
            label="Potvrzení hesla"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            aria-invalid={errors.passwordConfirm ? 'true' : 'false'}
            error={errors.passwordConfirm?.message}
            {...rhfRegister('passwordConfirm')}
          />
        </div>

        {submitError && (
          <div className={s.banner} role="alert" aria-live="polite">
            {submitError}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={register.isPending}
          disabled={blockedByAvailability}
          className={s.submit}
        >
          Vytvořit účet
        </Button>

        <div className={s.footer}>
          Už máš účet?{' '}
          <button
            type="button"
            className={s.crossLink}
            onClick={switchToLogin}
          >
            Přihlas se
          </button>
        </div>
      </form>
    </Modal>
  );
}
