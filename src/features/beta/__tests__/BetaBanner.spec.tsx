import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { BetaBanner } from '../BetaBanner';
import { BETA_BANNER_DISMISS_KEY } from '@/shared/config/betaStage';

// vi.mock factory je hoistnutá nad importy → mutovatelný stav přes vi.hoisted.
const h = vi.hoisted(() => ({
  auth: { v: true },
  init: { v: true },
  snap: {
    v: {
      dismissed: [] as string[],
      persona: null,
      journeys: {},
      seenRoutes: [] as string[],
      milestones: {},
      mode: 'active',
      backfilled: false,
    },
  },
  zavritTip: vi.fn(),
}));

vi.mock('jotai', () => ({ useAtomValue: () => h.auth.v }));
vi.mock('@/shared/store/authStore', () => ({ isAuthenticatedAtom: {} }));
vi.mock('@/shared/vypravec/state/onboardingStore', () => ({
  onboardingStore: {
    subscribe: () => () => {},
    getSnapshot: () => h.snap.v,
    get initHotovo() {
      return h.init.v;
    },
    zavritTip: h.zavritTip,
  },
}));

function setDismissed(ids: string[]) {
  h.snap.v = { ...h.snap.v, dismissed: ids };
}

describe('BetaBanner (25.3)', () => {
  beforeEach(() => {
    h.auth.v = true;
    h.init.v = true;
    setDismissed([]);
    h.zavritTip.mockClear();
  });
  afterEach(cleanup);

  it('anonym banner nevidí', () => {
    h.auth.v = false;
    render(<BetaBanner />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('nezobrazí se, dokud nedoběhl init (anti-flash cross-device)', () => {
    h.init.v = false;
    render(<BetaBanner />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('přihlášený s nezavřeným bannerem ho vidí (text + obě akce + zavřít)', () => {
    render(<BetaBanner />);
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByText(/Beta verze/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Nahlásit chybu' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Co je nového' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Rozumím, zavřít' })).toBeTruthy();
  });

  it('zavřený banner (dismissed obsahuje klíč) se nerenderuje', () => {
    setDismissed([BETA_BANNER_DISMISS_KEY]);
    render(<BetaBanner />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('„Nahlásit chybu" dispatchne vypravec:nahlasit-chybu', () => {
    const spy = vi.fn();
    window.addEventListener('vypravec:nahlasit-chybu', spy);
    render(<BetaBanner />);
    fireEvent.click(screen.getByRole('button', { name: 'Nahlásit chybu' }));
    expect(spy).toHaveBeenCalledTimes(1);
    window.removeEventListener('vypravec:nahlasit-chybu', spy);
  });

  it('„Co je nového" dispatchne vypravec:otevrit', () => {
    const spy = vi.fn();
    window.addEventListener('vypravec:otevrit', spy);
    render(<BetaBanner />);
    fireEvent.click(screen.getByRole('button', { name: 'Co je nového' }));
    expect(spy).toHaveBeenCalledTimes(1);
    window.removeEventListener('vypravec:otevrit', spy);
  });

  it('zavření volá zavritTip s verzovaným klíčem', () => {
    render(<BetaBanner />);
    fireEvent.click(screen.getByRole('button', { name: 'Rozumím, zavřít' }));
    expect(h.zavritTip).toHaveBeenCalledWith(BETA_BANNER_DISMISS_KEY);
  });
});
