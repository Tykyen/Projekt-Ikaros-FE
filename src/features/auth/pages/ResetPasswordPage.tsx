import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { toast } from 'sonner';
import { parseApiErrorCode } from '@/shared/api';
import { Input, Button } from '@/shared/ui';
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from '../lib/resetPasswordSchema';
import { useResetPassword } from '../api/useResetPassword';
import { PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator';
import { openForgotPasswordModalAtom } from '@/shared/store/authStore';
import s from './ResetPasswordPage.module.css';

function codeToMessage(code: string | null): string {
  switch (code) {
    case 'INVALID_TOKEN':
      return 'Reset link je neplatný. Požádej o nový.';
    case 'EXPIRED_TOKEN':
      return 'Reset link vypršel. Požádej o nový.';
    case 'ALREADY_USED':
      return 'Reset link byl už použit. Požádej o nový.';
    // (WEAK_PASSWORD odstraněn — BE ho nehází; slabé heslo blokne client-side zod,
    //  případně BE vrátí VALIDATION → default hláška. EC-contract: mrtvá větev.)
    default:
      return 'Reset hesla se nezdařil. Zkus to znovu.';
  }
}

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const openForgot = useSetAtom(openForgotPasswordModalAtom);
  const [showPassword, setShowPassword] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const mutation = useResetPassword();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
    defaultValues: { newPassword: '', passwordConfirm: '' },
  });

  const newPassword = useWatch({ control, name: 'newPassword' });

  if (!token) {
    return (
      <div className={s.shell}>
        <div className={s.card}>
          <h1 className={s.title}>Reset hesla</h1>
          <p className={s.lead}>
            Reset link chybí nebo je neplatný. Můžeš požádat o nový.
          </p>
          <Button
            variant="primary"
            size="lg"
            className={s.submit}
            onClick={() => {
              navigate('/');
              openForgot();
            }}
          >
            Požádat o nový link
          </Button>
        </div>
      </div>
    );
  }

  async function onSubmit(values: ResetPasswordFormValues) {
    setErrorCode(null);
    try {
      const result = await mutation.mutateAsync({
        token: token!,
        newPassword: values.newPassword,
      });

      toast.success('Heslo bylo změněno. Můžeš se přihlásit.');

      if (result.deletionReactivated) {
        toast.info('Tvůj účet byl současně obnoven ze stavu mazání.');
      }
      if (result.revertablePromotions?.length) {
        // Předáme info do session storage; LoginModal po loginu zobrazí.
        try {
          sessionStorage.setItem(
            'ikaros.revertablePromotions',
            JSON.stringify(result.revertablePromotions),
          );
        } catch {
          /* storage quota — ignore */
        }
      }
      navigate('/?openLogin=1');
    } catch (err) {
      setErrorCode(parseApiErrorCode(err) ?? 'UNKNOWN'); // EC-08 fix: wrapped data.error.code
    }
  }

  return (
    <div className={s.shell}>
      <div className={s.card}>
        <h1 className={s.title}>Nastavit nové heslo</h1>
        <p className={s.lead}>
          Zadej nové heslo. Po uložení tě přesměrujeme na přihlášení.
        </p>

        <form className={s.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={s.passwordWrap}>
            <Input
              label="Nové heslo"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              aria-invalid={errors.newPassword ? 'true' : 'false'}
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <button
              type="button"
              className={s.toggle}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Skrýt heslo' : 'Zobrazit heslo'}
              tabIndex={-1}
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>

          <PasswordStrengthIndicator password={newPassword ?? ''} />

          <Input
            label="Potvrzení hesla"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            aria-invalid={errors.passwordConfirm ? 'true' : 'false'}
            error={errors.passwordConfirm?.message}
            {...register('passwordConfirm')}
          />

          {errorCode && (
            <div className={s.banner} role="alert" aria-live="polite">
              {codeToMessage(errorCode)}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={mutation.isPending}
            className={s.submit}
          >
            Nastavit nové heslo
          </Button>
        </form>

        {errorCode &&
          ['INVALID_TOKEN', 'EXPIRED_TOKEN', 'ALREADY_USED'].includes(
            errorCode,
          ) && (
            <div className={s.linkRow}>
              <button
                type="button"
                className={s.crossLink}
                onClick={() => {
                  navigate('/');
                  openForgot();
                }}
              >
                Požádat o nový link
              </button>
            </div>
          )}
      </div>
    </div>
  );
}
