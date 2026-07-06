/**
 * 1.7 — Potvrzení změny e-mailu (po kliku v mailu zaslaném na NOVÝ e-mail).
 *
 * On-mount automaticky POST /auth/email-change-confirm { token }.
 * Stavy: verifying → success / failed (s důvodem).
 */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button, Spinner } from '@/shared/ui';
import { useEmailChangeConfirm } from '../api/useEmailChangeConfirm';
import { parseApiErrorCode } from '@/shared/api/client';
import s from './ResetPasswordPage.module.css';

type State = 'verifying' | 'success' | 'failed';

function codeToMessage(code: string | null): string {
  switch (code) {
    case 'INVALID_TOKEN':
      return 'Potvrzovací link je neplatný.';
    case 'EXPIRED_TOKEN':
      return 'Potvrzovací link vypršel. Požádej o změnu znovu z profilu.';
    case 'ALREADY_USED':
      return 'Tento link byl už použit.';
    case 'EMAIL_TAKEN':
      return 'Mezitím si tento e-mail zaregistroval někdo jiný. Zvol si jiný e-mail v profilu.';
    default:
      return 'Změnu e-mailu se nepodařilo potvrdit.';
  }
}

export default function EmailChangeConfirmPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const confirm = useEmailChangeConfirm();
  const [state, setState] = useState<State>(token ? 'verifying' : 'failed');
  const [errorCode, setErrorCode] = useState<string | null>(
    token ? null : 'INVALID_TOKEN',
  );

  useEffect(() => {
    if (!token) return;
    confirm
      .mutateAsync(token)
      .then(() => {
        setState('success');
        // C-30 — invalidace ['users','me'] je v useEmailChangeConfirm.onSuccess.
        toast.success('E-mail byl úspěšně změněn.');
      })
      .catch((err) => {
        setErrorCode(parseApiErrorCode(err));
        setState('failed');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={s.shell}>
      <div className={s.card}>
        {state === 'verifying' && (
          <>
            <h1 className={s.title}>Potvrzuji změnu e-mailu…</h1>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Spinner />
            </div>
          </>
        )}

        {state === 'success' && (
          <>
            <h1 className={s.title}>✓ E-mail úspěšně změněn!</h1>
            <p className={s.lead}>
              Tvůj e-mail je teď aktualizovaný. Použij ho při příštím přihlášení.
            </p>
            <Button
              variant="primary"
              size="lg"
              className={s.submit}
              onClick={() => navigate('/ikaros/profil')}
            >
              Přejít na profil
            </Button>
          </>
        )}

        {state === 'failed' && (
          <>
            <h1 className={s.title}>Potvrzení se nezdařilo</h1>
            <p className={s.lead}>{codeToMessage(errorCode)}</p>
            <Button
              variant="primary"
              size="lg"
              className={s.submit}
              onClick={() => navigate('/ikaros/profil')}
            >
              Zpět do profilu
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
