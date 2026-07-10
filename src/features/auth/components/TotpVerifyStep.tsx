import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Modal, Input, Button } from '@/shared/ui';
import { useLoginTotp } from '@/features/auth/api/useAuth';
import { consumeLoginIntent } from '@/shared/lib/loginIntent';
import { parseApiErrorCode } from '@/shared/api/client';
import s from './TotpVerifyStep.module.css';

interface Props {
  open: boolean;
  challengeId: string;
  /** Zpět na zadání hesla (zruší 2FA krok). */
  onCancel: () => void;
}

/**
 * 14.1 — druhý krok loginu. Po `status:'totp_required'` z useLogin zachytí
 * LoginModal challengeId a vyrenderuje tento overlay: 6místný TOTP kód nebo
 * záložní kód + volba „důvěřovat zařízení". Úspěch nasadí tokeny (useLoginTotp).
 */
export function TotpVerifyStep({ open, challengeId, onCancel }: Props) {
  const loginTotp = useLoginTotp();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function mapError(err: unknown): string {
    if (axios.isAxiosError(err)) {
      const code = parseApiErrorCode(err);
      const status = err.response?.status;
      if (code === 'TOTP_INVALID_CODE') {
        return useBackup ? 'Neplatný záložní kód.' : 'Neplatný kód.';
      }
      if (
        code === 'EXPIRED_TOKEN' ||
        code === 'INVALID_TOKEN' ||
        code === 'ALREADY_USED'
      ) {
        return 'Platnost přihlášení vypršela, přihlas se prosím znovu.';
      }
      if (status === 429)
        return 'Příliš mnoho pokusů. Zkus to za chvíli, nebo se přihlas znovu.';
      if (status && status >= 500) return 'Něco se pokazilo. Zkus to znovu.';
    }
    return 'Ověření se nezdařilo.';
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const result = await loginTotp.mutateAsync({
        challengeId,
        code: code.trim(),
        trustDevice,
      });
      if (result.status !== 'ok') {
        setError('Neočekávaná odpověď serveru.');
        return;
      }
      const intent = consumeLoginIntent();
      const username = result.user.displayName ?? result.user.username;
      toast.success(`Vítej zpět, ${username}!`);
      navigate(intent ?? '/');
    } catch (err) {
      setError(mapError(err));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Dvoufaktorové ověření"
      size="sm"
      closeOnBackdrop={false}
    >
      <form className={s.form} onSubmit={onSubmit} noValidate>
        <p className={s.intro}>
          {useBackup
            ? 'Zadej jeden ze svých záložních kódů.'
            : 'Otevři aplikaci authenticator a opiš 6místný kód.'}
        </p>

        {/* eslint-disable jsx-a11y/no-autofocus -- autofocus na první pole je záměr: modal trapuje fokus, uživatel čeká kurzor v poli ověřovacího kódu */}
        <Input
          label={useBackup ? 'Záložní kód' : 'Ověřovací kód'}
          autoFocus
          autoComplete="one-time-code"
          inputMode={useBackup ? 'text' : 'numeric'}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        {/* eslint-enable jsx-a11y/no-autofocus */}

        <button
          type="button"
          className={s.linkBtn}
          onClick={() => {
            setUseBackup((v) => !v);
            setCode('');
            setError(null);
          }}
        >
          {useBackup ? 'Použít kód z aplikace' : 'Použít záložní kód'}
        </button>

        <label className={s.checkboxRow}>
          <input
            type="checkbox"
            checked={trustDevice}
            onChange={(e) => setTrustDevice(e.target.checked)}
          />
          <span>Důvěřovat tomuto zařízení 30 dní</span>
        </label>

        {error && (
          <div className={s.banner} role="alert" aria-live="polite">
            {error}
          </div>
        )}

        <div className={s.actions}>
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loginTotp.isPending}
          >
            Zpět
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loginTotp.isPending}
            disabled={!code.trim()}
          >
            Ověřit
          </Button>
        </div>
      </form>
    </Modal>
  );
}
