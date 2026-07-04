import { useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { Beer } from 'lucide-react';
import { Button } from '@/shared/ui';
import { useAnonSession } from '../api/useAnonSession';
import s from './AnonChatGate.module.css';

// D-011 — Cloudflare Turnstile site key (sdíleno s registrací).
const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';
const TURNSTILE_SITE_KEY: string | null =
  import.meta.env.VITE_TURNSTILE_SITE_KEY ??
  (import.meta.env.PROD ? null : TURNSTILE_TEST_SITE_KEY);

/**
 * Spec 15.8 — vstupní brána Hospody pro nepřihlášeného. Captcha → guest session,
 * pak rodič (ChatPage) vykreslí chat v „host módu".
 */
export function AnonChatGate() {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { startSession, isPending, isError } = useAnonSession();

  return (
    <div className={s.gate}>
      <div className={s.card}>
        <Beer size={40} className={s.icon} aria-hidden="true" />
        <h2 className={s.title}>Vstup do Putyky jako host</h2>
        <p className={s.lead}>
          Popovídej si s komunitou pod dočasnou přezdívkou — bez registrace.
          Vlastní svět, postavu a poštu získáš až po registraci.
        </p>

        {TURNSTILE_SITE_KEY === null ? (
          <div className={s.banner} role="alert" aria-live="polite">
            Ověření „nejsi robot" je dočasně nedostupné. Zkus to prosím později.
          </div>
        ) : (
          <Turnstile
            siteKey={TURNSTILE_SITE_KEY}
            onSuccess={(t) => setCaptchaToken(t)}
            onError={() => setCaptchaToken(null)}
            onExpire={() => setCaptchaToken(null)}
            options={{ theme: 'auto' }}
          />
        )}

        <Button
          variant="primary"
          size="lg"
          disabled={!captchaToken || isPending}
          onClick={() => {
            if (captchaToken) void startSession(captchaToken);
          }}
        >
          {isPending ? 'Připojuji…' : 'Vstoupit jako host'}
        </Button>

        {isError && (
          <p className={s.error} role="alert">
            Nepodařilo se vstoupit. Zkus to prosím znovu.
          </p>
        )}
      </div>
    </div>
  );
}
