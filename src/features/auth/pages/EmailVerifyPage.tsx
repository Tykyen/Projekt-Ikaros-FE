/**
 * 1.7 — Verifikace e-mailu (po kliku v mailu).
 *
 * On-mount automaticky POST /auth/email-verify { token }.
 * Stavy: verifying → success / failed (s důvodem + možností resend pokud JWT).
 */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import axios from 'axios';
import { Button, Spinner } from '@/shared/ui';
import { useEmailVerify, useEmailVerifyResend } from '../api/useEmailVerify';
import { accessTokenAtom } from '@/shared/store/authStore';
import s from './ResetPasswordPage.module.css';

type State = 'verifying' | 'success' | 'failed';

function extractCode(err: unknown): string | null {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { code?: string } | undefined;
    return data?.code ?? null;
  }
  return null;
}

function codeToMessage(code: string | null): string {
  switch (code) {
    case 'INVALID_TOKEN':
      return 'Verifikační link je neplatný.';
    case 'EXPIRED_TOKEN':
      return 'Verifikační link vypršel.';
    case 'ALREADY_USED':
      return 'Tento link byl už použit — e-mail je pravděpodobně ověřen.';
    default:
      return 'Ověření e-mailu se nezdařilo.';
  }
}

export default function EmailVerifyPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const accessToken = useAtomValue(accessTokenAtom);
  const verify = useEmailVerify();
  const resend = useEmailVerifyResend();
  const [state, setState] = useState<State>(token ? 'verifying' : 'failed');
  const [errorCode, setErrorCode] = useState<string | null>(
    token ? null : 'INVALID_TOKEN',
  );
  const [resentToast, setResentToast] = useState(false);

  useEffect(() => {
    if (!token) return;
    verify
      .mutateAsync(token)
      .then(() => setState('success'))
      .catch((err) => {
        setErrorCode(extractCode(err));
        setState('failed');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleResend() {
    try {
      await resend.mutateAsync();
      setResentToast(true);
    } catch {
      /* mutation handles error state via mutation.isError */
    }
  }

  return (
    <div className={s.shell}>
      <div className={s.card}>
        {state === 'verifying' && (
          <>
            <h1 className={s.title}>Ověřuji e-mail…</h1>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Spinner />
            </div>
          </>
        )}

        {state === 'success' && (
          <>
            <h1 className={s.title}>✓ E-mail úspěšně ověřen!</h1>
            <p className={s.lead}>
              Tvůj e-mail je teď ověřen. Můžeš pokračovat na úvodník.
            </p>
            <Button
              variant="primary"
              size="lg"
              className={s.submit}
              onClick={() => navigate(accessToken ? '/' : '/?openLogin=1')}
            >
              Pokračovat
            </Button>
          </>
        )}

        {state === 'failed' && (
          <>
            <h1 className={s.title}>Ověření se nezdařilo</h1>
            <p className={s.lead}>{codeToMessage(errorCode)}</p>
            {resentToast && (
              <div
                className={s.banner}
                style={{
                  background: 'var(--success-soft, transparent)',
                  borderColor: 'var(--success)',
                  color: 'var(--success)',
                }}
              >
                Verifikační e-mail jsme znovu odeslali. Mrkni do schránky.
              </div>
            )}
            {accessToken ? (
              <Button
                variant="primary"
                size="lg"
                className={s.submit}
                loading={resend.isPending}
                onClick={handleResend}
              >
                Poslat verifikaci znovu
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                className={s.submit}
                onClick={() => navigate('/?openLogin=1')}
              >
                Přihlas se a požádej o nový link
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
