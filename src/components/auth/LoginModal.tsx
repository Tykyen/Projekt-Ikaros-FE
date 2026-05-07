import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Modal } from '../ui/Modal/Modal';
import { Input } from '../ui/Input/Input';
import { Button } from '../ui/Button/Button';
import { loginSchema, type LoginFormValues } from './loginSchema';
import { useLogin } from '../../api/hooks/useAuth';
import { loginModalOpenAtom } from '../../store/authStore';
import s from './LoginModal.module.css';

const LOGIN_INTENT_KEY = 'ikaros.loginIntent';

function mapErrorToMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401) return 'Nesprávné přihlašovací údaje';
    if (status === 429) return 'Příliš mnoho pokusů. Zkus to znovu za chvíli.';
    if (status === undefined || status === 0) return 'Nepodařilo se připojit k serveru.';
    if (status >= 500) return 'Něco se pokazilo. Zkus to znovu.';
    if (status === 400) return 'Chybný formát zadání.';
    return 'Přihlášení se nezdařilo.';
  }
  return 'Přihlášení se nezdařilo.';
}

function isSafeRedirect(target: string | null): target is string {
  if (!target) return false;
  return target.startsWith('/') && !target.startsWith('//');
}

export function LoginModal() {
  const [open, setOpen] = useAtom(loginModalOpenAtom);
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { identifier: '', password: '' },
  });

  function close() {
    setOpen(false);
    setSubmitError(null);
    setShowPassword(false);
    reset();
  }

  async function onSubmit(values: LoginFormValues) {
    setSubmitError(null);
    try {
      const result = await login.mutateAsync(values);
      const intent = sessionStorage.getItem(LOGIN_INTENT_KEY);
      sessionStorage.removeItem(LOGIN_INTENT_KEY);

      const username = result.user.displayName ?? result.user.username;
      toast.success(`Vítej zpět, ${username}!`);
      close();

      if (isSafeRedirect(intent)) {
        navigate(intent);
      }
    } catch (err) {
      setSubmitError(mapErrorToMessage(err));
    }
  }

  return (
    <Modal open={open} onClose={close} title="Přihlášení" size="sm">
      <form className={s.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="E-mail nebo přezdívka"
          autoFocus
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={errors.identifier ? 'true' : 'false'}
          error={errors.identifier?.message}
          {...register('identifier')}
        />

        <div className={s.passwordWrap}>
          <Input
            label="Heslo"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            aria-invalid={errors.password ? 'true' : 'false'}
            error={errors.password?.message}
            {...register('password')}
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

        {submitError && (
          <div className={s.banner} role="alert" aria-live="polite">
            {submitError}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={login.isPending}
          className={s.submit}
        >
          Přihlásit se
        </Button>

        <div className={s.footer}>
          Nemáš účet? Registrace připravujeme.
        </div>
      </form>
    </Modal>
  );
}
