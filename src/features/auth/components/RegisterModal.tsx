import { useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAtom, useSetAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { Modal } from '@/shared/ui';
import { Input } from '@/shared/ui';
import { Button } from '@/shared/ui';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { AvailabilityIcon, type AvailabilityStatus } from './AvailabilityIcon';
import { registerSchema, type RegisterFormValues } from '../lib/registerSchema';
import { useRegister } from '@/features/auth/api/useAuth';
import { useCheckUsername, useCheckEmail } from '@/features/auth/api/useAvailability';
import {
  registerModalOpenAtom,
  openLoginModalAtom,
} from '@/shared/store/authStore';
import { parseApiErrorCode } from '@/shared/api/client';
import { consumeLoginIntent } from '@/shared/lib/loginIntent';
import s from './RegisterModal.module.css';

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

// D-011 — Cloudflare Turnstile site key.
// DEV bez env → test key (vždy projde, pohodlné pro vývoj).
// PROD bez env → null = fail-closed: NErenderujeme widget a NEpřepadneme tiše na
// test key (jinak by captcha přestala chránit, aniž si toho kdo všiml — 14.2).
const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';
const TURNSTILE_SITE_KEY: string | null =
  import.meta.env.VITE_TURNSTILE_SITE_KEY ??
  (import.meta.env.PROD ? null : TURNSTILE_TEST_SITE_KEY);

if (TURNSTILE_SITE_KEY === null) {
  // Viditelné v prod logu — captcha je nakonfigurovaná špatně, registrace nepojede.
  console.error(
    '[captcha] VITE_TURNSTILE_SITE_KEY chybí v produkčním buildu — registrace zablokována (fail-closed).',
  );
}

export function RegisterModal() {
  const [open, setOpen] = useAtom(registerModalOpenAtom);
  const openLogin = useSetAtom(openLoginModalAtom);
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<TurnstileInstance | null>(null);
  const navigate = useNavigate();
  const register = useRegister();

  const {
    register: rhfRegister,
    handleSubmit,
    formState: { errors },
    control,
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
      acceptedTerms: false,
      hp: '',
    },
  });

  const emailValue = useWatch({ control, name: 'email' });
  const usernameValue = useWatch({ control, name: 'username' });
  const passwordValue = useWatch({ control, name: 'password' });

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
      if (!captchaToken) {
        setSubmitError('Nejprve ověř že nejsi robot (vyplň captchu).');
        return;
      }
      const result = await register.mutateAsync({
        email: values.email,
        username: values.username,
        password: values.password,
        acceptedTerms: values.acceptedTerms,
        // 20C §C2 — odvození deklarativního věku z volby (under15 = nezletilý).
        isMinor: values.ageBracket === 'under15',
        hp: values.hp,
        captchaToken,
      });
      const intent = consumeLoginIntent();

      const username = result.user.displayName ?? result.user.username;
      toast.success(`Vítej, ${username}! Účet vytvořen.`);
      close();

      navigate(intent ?? '/');
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
      } else if (code === 'CAPTCHA_FAILED') {
        setSubmitError('Ověření captchy selhalo. Zkus to znovu.');
        captchaRef.current?.reset();
        setCaptchaToken(null);
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
      {/* eslint-disable-next-line react-hooks/refs -- RHF idiom: onSubmit čte captchaRef až při submitu, ne při renderu (R19 false-positive) */}
      <form className={s.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={s.fieldWrap}>
          {/* eslint-disable jsx-a11y/no-autofocus -- autofocus na první pole je záměr: modal trapuje fokus, uživatel čeká kurzor v poli e-mailu */}
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
          {/* eslint-enable jsx-a11y/no-autofocus */}
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

        {/* D-011 — honeypot field. Skutečný uživatel ho nevidí. Bot vyplní → bot detection. */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '-9999px',
            width: '1px',
            height: '1px',
            opacity: 0,
            pointerEvents: 'none',
          }}
          {...rhfRegister('hp')}
        />

        {/* D-010 — GDPR souhlas */}
        <label className={s.terms}>
          <input type="checkbox" {...rhfRegister('acceptedTerms')} />
          <span>
            Souhlasím s{' '}
            <a href="/podminky" target="_blank" rel="noopener noreferrer">
              podmínkami použití
            </a>
            .
          </span>
        </label>
        {errors.acceptedTerms && (
          <p className={s.bannerError} role="alert" aria-live="polite">
            {errors.acceptedTerms.message}
          </p>
        )}

        {/* 20A — Zásady OÚ = informace (bereš na vědomí), NE součást souhlasu. */}
        <p className={s.privacyNote}>
          Registrací bereš na vědomí{' '}
          <a href="/soukromi" target="_blank" rel="noopener noreferrer">
            Zásady ochrany osobních údajů
          </a>
          .
        </p>

        {/* 20C §C2 — deklarativní věk. Minimalizace: jen 15+/<15, ne datum narození. */}
        <fieldset className={s.age}>
          <legend className={s.ageLegend}>Kolik ti je let?</legend>
          <label className={s.ageOption}>
            <input type="radio" value="15plus" {...rhfRegister('ageBracket')} />
            <span>Je mi 15 nebo více</span>
          </label>
          <label className={s.ageOption}>
            <input type="radio" value="under15" {...rhfRegister('ageBracket')} />
            <span>Je mi méně než 15 let</span>
          </label>
          <p className={s.ageNote}>
            U mladších 15 let platí přísnější režim ochrany a je potřeba souhlas
            zákonného zástupce — víc v{' '}
            <a href="/soukromi" target="_blank" rel="noopener noreferrer">
              Zásadách ochrany osobních údajů
            </a>
            .
          </p>
        </fieldset>
        {errors.ageBracket && (
          <p className={s.bannerError} role="alert" aria-live="polite">
            {errors.ageBracket.message}
          </p>
        )}

        {submitError && (
          <div className={s.banner} role="alert" aria-live="polite">
            {submitError}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
          {TURNSTILE_SITE_KEY === null ? (
            <div className={s.banner} role="alert" aria-live="polite">
              Ověření „nejsi robot" je dočasně nedostupné. Registrace teď
              nefunguje, zkus to prosím později.
            </div>
          ) : (
            <Turnstile
              ref={captchaRef}
              siteKey={TURNSTILE_SITE_KEY}
              onSuccess={(token) => setCaptchaToken(token)}
              onError={() => setCaptchaToken(null)}
              onExpire={() => setCaptchaToken(null)}
              options={{ theme: 'auto' }}
            />
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={register.isPending}
          disabled={blockedByAvailability || !captchaToken}
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
