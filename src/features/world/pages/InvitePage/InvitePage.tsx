import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Spinner, ErrorState } from '@/shared/ui';
import { useAcceptLinkInvite } from '@/features/world/api/useWorldInvites';
import s from './InvitePage.module.css';

interface ApiErr {
  response?: { data?: { code?: string } };
}

/**
 * 15.10 fáze B — přijetí pozvacího ODKAZU. Route `/invite/:token` je
 * login-required (router `requireAuth` uloží intent → po loginu se vrátí sem).
 * Po mountu zavolá accept a přesměruje do světa; friendly chyba u neplatného
 * odkazu (auth-leak-policy — nerozlišujeme detailně, jen „už neplatí").
 */
export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const accept = useAcceptLinkInvite();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !token) return;
    ran.current = true;
    accept.mutate(token, {
      onSuccess: (res) => {
        toast.success('Přidal ses do světa.');
        navigate(`/svet/${res.worldSlug}`, { replace: true });
      },
      onError: (e) => {
        const code = (e as ApiErr).response?.data?.code;
        setError(
          code === 'WORLD_ALREADY_MEMBER'
            ? 'V tomto světě už jsi členem.'
            : 'Tento pozvací odkaz už neplatí — vypršel, byl zrušen nebo vyčerpán.',
        );
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (error) {
    return (
      <div className={s.wrap}>
        <ErrorState
          size="hero"
          title="Pozvánku nelze použít"
          description={error}
          action={{ label: 'Moje světy', to: '/ikaros/vesmiry' }}
        />
      </div>
    );
  }

  return (
    <div className={s.wrap}>
      <Spinner center />
      <p className={s.msg}>Přijímám pozvánku…</p>
    </div>
  );
}
