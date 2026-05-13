import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAtom, useSetAtom } from 'jotai';
import { toast } from 'sonner';
import axios from 'axios';
import { Modal, Input, Button } from '@/shared/ui';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '../lib/forgotPasswordSchema';
import { useForgotPassword } from '../api/useForgotPassword';
import {
  forgotPasswordModalOpenAtom,
  openLoginModalAtom,
} from '@/shared/store/authStore';
import s from './ForgotPasswordModal.module.css';

function mapError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 429)
      return 'Příliš mnoho pokusů. Zkus to znovu za chvíli.';
    if (status === undefined || status === 0)
      return 'Nepodařilo se připojit k serveru.';
    if (status >= 500) return 'Něco se pokazilo. Zkus to znovu.';
  }
  return 'Žádost se nepodařilo odeslat.';
}

export function ForgotPasswordModal() {
  const [open, setOpen] = useAtom(forgotPasswordModalOpenAtom);
  const openLogin = useSetAtom(openLoginModalAtom);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mutation = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
    defaultValues: { email: '' },
  });

  function close() {
    setOpen(false);
    setSubmitError(null);
    reset();
  }

  function switchToLogin() {
    reset();
    setSubmitError(null);
    openLogin();
  }

  async function onSubmit(values: ForgotPasswordFormValues) {
    setSubmitError(null);
    try {
      await mutation.mutateAsync(values.email);
      toast.success(
        'Pokud e-mail existuje, poslali jsme ti link na reset hesla.',
      );
      close();
    } catch (err) {
      setSubmitError(mapError(err));
    }
  }

  return (
    <Modal open={open} onClose={close} title="Zapomenuté heslo" size="sm">
      <form className={s.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <p className={s.lead}>
          Zadej e-mail, který používáš pro přihlášení. Pokud ho najdeme,
          pošleme ti odkaz pro nastavení nového hesla.
        </p>

        <Input
          label="E-mail"
          type="email"
          autoFocus
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={errors.email ? 'true' : 'false'}
          error={errors.email?.message}
          {...register('email')}
        />

        {submitError && (
          <div className={s.banner} role="alert" aria-live="polite">
            {submitError}
          </div>
        )}

        <div className={s.actions}>
          <Button type="button" variant="ghost" onClick={close}>
            Zrušit
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={mutation.isPending}
            className={s.submit}
          >
            Poslat link
          </Button>
        </div>

        <div className={s.footer}>
          Vzpomněl/a sis na heslo?{' '}
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
