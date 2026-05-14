import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import clsx from 'clsx';
import { Hourglass, Lock, ArrowRight, LogIn } from 'lucide-react';
import type { World, WorldMembership } from '@/shared/types';
import { WorldRole } from '@/shared/types';
import { useJoinWorld } from '@/features/world/api/useJoinWorld';
import { saveLoginIntent } from '@/shared/lib/loginIntent';
import s from './WorldDetailJoinCTA.module.css';

interface Props {
  world: World;
  myMembership: WorldMembership | null;
  isAuthenticated: boolean;
}

type CTAState =
  | 'anon'
  | 'public-join'
  | 'request-join'
  | 'pending'
  | 'member'
  | 'closed';

function resolveState(
  world: World,
  myMembership: WorldMembership | null,
  isAuthenticated: boolean,
): CTAState {
  if (world.accessMode === 'closed') return 'closed';
  if (myMembership && myMembership.role === WorldRole.Zadatel) return 'pending';
  if (myMembership && myMembership.role !== WorldRole.Zadatel) return 'member';
  if (!isAuthenticated) return 'anon';
  return world.accessMode === 'public' ? 'public-join' : 'request-join';
}

/**
 * Spec 2.4 — Join CTA, 5 stavů:
 *   anon         → „Vstoupit"            → otevře login modal s redirect intent
 *   public-join  → „Vstoupit"            → POST /join → toast → navigate /svet/:id
 *   request-join → „Požádat o vstup"    → POST /join → toast „Žádost odeslána"
 *   pending      → „⏳ Žádost odeslána"  → disabled (čekej na schválení PJ)
 *   member       → „Vstoupit do hry →"   → navigate /svet/:id
 *   closed       → „🔒 Svět je uzavřen"  → disabled
 */
export function WorldDetailJoinCTA({
  world,
  myMembership,
  isAuthenticated,
}: Props) {
  const state = resolveState(world, myMembership, isAuthenticated);
  const navigate = useNavigate();
  const join = useJoinWorld();

  const handleAnonClick = () => {
    saveLoginIntent(`/svet/${world.id}/info`);
    void navigate('/?openLogin=1');
  };

  const handleJoin = async (mode: 'public' | 'request') => {
    try {
      await join.mutateAsync(world.id);
      if (mode === 'public') {
        toast.success(`Vstoupil/a jsi do „${world.name}".`);
        void navigate(`/svet/${world.id}`);
      } else {
        toast.success('Žádost odeslána, čekej na schválení PJ.');
      }
    } catch {
      toast.error('Vstup se nezdařil. Zkus to znovu.');
    }
  };

  const handleEnterGame = () => {
    void navigate(`/svet/${world.id}`);
  };

  if (state === 'anon') {
    return (
      <button
        type="button"
        className={clsx(s.cta, s.primary)}
        onClick={handleAnonClick}
      >
        <LogIn size={18} aria-hidden />
        Vstoupit
      </button>
    );
  }

  if (state === 'public-join') {
    return (
      <button
        type="button"
        className={clsx(s.cta, s.primary)}
        onClick={() => handleJoin('public')}
        disabled={join.isPending}
      >
        {join.isPending ? 'Vstupuji…' : 'Vstoupit'}
      </button>
    );
  }

  if (state === 'request-join') {
    return (
      <button
        type="button"
        className={clsx(s.cta, s.primary)}
        onClick={() => handleJoin('request')}
        disabled={join.isPending}
      >
        {join.isPending ? 'Odesílám…' : 'Požádat o vstup'}
      </button>
    );
  }

  if (state === 'pending') {
    return (
      <button
        type="button"
        className={clsx(s.cta, s.disabledPending)}
        disabled
        aria-disabled
        title="Žádost odeslána, čekej na schválení PJ"
      >
        <Hourglass size={16} aria-hidden />
        Žádost odeslána
      </button>
    );
  }

  if (state === 'member') {
    return (
      <button
        type="button"
        className={clsx(s.cta, s.primary)}
        onClick={handleEnterGame}
      >
        Vstoupit do hry
        <ArrowRight size={18} aria-hidden />
      </button>
    );
  }

  // closed
  return (
    <button
      type="button"
      className={clsx(s.cta, s.disabledClosed)}
      disabled
      aria-disabled
      title="PJ tento svět uzavřel"
    >
      <Lock size={16} aria-hidden />
      Svět je uzavřen
    </button>
  );
}
