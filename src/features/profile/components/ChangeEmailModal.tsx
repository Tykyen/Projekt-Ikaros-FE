import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import axios from 'axios';
import { parseApiErrorCode } from '@/shared/api';
import { Modal, Input, Button } from '@/shared/ui';
import {
  emailChangeSchema,
  type EmailChangeFormValues,
} from '../lib/emailChangeSchema';
import { useEmailChangeRequest } from '../api/useEmailChangeRequest';
import s from './ChangeEmailModal.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  currentEmail: string;
}

export function ChangeEmailModal({ open, onClose, currentEmail }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mutation = useEmailChangeRequest();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
    reset,
  } = useForm<EmailChangeFormValues>({
    resolver: zodResolver(emailChangeSchema),
    mode: 'onBlur',
    defaultValues: { newEmail: '', currentPassword: '' },
  });

  function close() {
    onClose();
    setShowPassword(false);
    setSubmitError(null);
    reset();
  }

  async function onSubmit(values: EmailChangeFormValues) {
    setSubmitError(null);
    try {
      const result = await mutation.mutateAsync(values);
      toast.success(
        `Klikni na link v e-mailu, který jsme poslali na ${result.sentTo}.`,
      );
      close();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        // EC-08 fix: čteme přes parseApiErrorCode (wrapped `data.error.code`).
        // Dřív lokální flat typ `data.code` → vždy undefined → field-mapping mrtvý.
        const code = parseApiErrorCode(err);
        if (code === 'INVALID_PASSWORD') {
          setError('currentPassword', { message: 'Heslo nesouhlasí' });
          return;
        }
        if (code === 'SAME_EMAIL') {
          setError('newEmail', {
            message: 'Nový e-mail je stejný jako aktuální',
          });
          return;
        }
        if (code === 'EMAIL_TAKEN') {
          setError('newEmail', { message: 'E-mail je obsazený' });
          return;
        }
        if (err.response?.status === 429) {
          setSubmitError('Příliš mnoho pokusů. Zkus to znovu za chvíli.');
          return;
        }
      }
      setSubmitError('Změnu e-mailu se nepodařilo odeslat.');
    }
  }

  return (
    <Modal open={open} onClose={close} title="Změnit e-mail" size="sm">
      <form className={s.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <p className={s.lead}>
          Na nový e-mail pošleme potvrzovací link. Po kliknutí se adresa přepne.
        </p>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--sp-1)',
            }}
          >
            Aktuální e-mail
          </label>
          <div className={s.currentEmail}>{currentEmail}</div>
        </div>

        <Input
          label="Nový e-mail"
          type="email"
          autoFocus
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={errors.newEmail ? 'true' : 'false'}
          error={errors.newEmail?.message}
          {...register('newEmail')}
        />

        <div className={s.passwordWrap}>
          <Input
            label="Aktuální heslo"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            aria-invalid={errors.currentPassword ? 'true' : 'false'}
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
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
            loading={mutation.isPending}
          >
            Odeslat link
          </Button>
        </div>
      </form>
    </Modal>
  );
}
