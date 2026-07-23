/**
 * Spec 26.3 (D6 FE) — onboardingStore: lokální merge sémantika (zrcadlo BE),
 * koalescence front, persistence A→B→A (fb_persist_variants), anon→účet merge,
 * backfill legacy, keepalive flush.
 *
 * Store je modulový singleton s identitou z authStore → testy řídí identitu
 * přes jotai store a čistí localStorage.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getDefaultStore } from 'jotai';
import { currentUserAtom } from '@/shared/store/authStore';
import type { User } from '@/shared/types';
import {
  aplikujDeltuLokalne,
  sloucitDelty,
  onboardingStore,
  type OnboardingStateFE,
} from '../onboardingStore';

vi.mock('@/shared/api', () => ({
  api: { get: vi.fn(), patch: vi.fn() },
}));
import { api } from '@/shared/api';

const jotai = getDefaultStore();
const PRAZDNY: OnboardingStateFE = {
  persona: null,
  journeys: {},
  seenRoutes: [],
  dismissed: [],
  milestones: {},
  mode: 'active',
  backfilled: false,
};

function prihlasit(id: string) {
  jotai.set(currentUserAtom, { id } as unknown as User);
}

beforeEach(() => {
  localStorage.clear();
  vi.mocked(api.patch).mockResolvedValue({});
  vi.mocked(api.get).mockResolvedValue({ state: null, legacy: false });
  jotai.set(currentUserAtom, null);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('aplikujDeltuLokalne — zrcadlo BE merge', () => {
  it('set-union pole, $min kroky, FWW contextWorldId, LWW pauza', () => {
    let s = aplikujDeltuLokalne(PRAZDNY, {
      dismissedAdd: ['tip1'],
      journeys: {
        j1: {
          startedAt: '2026-07-21T10:00:00Z',
          contextWorldId: 'svet-A',
          steps: { 'pj.a': '2026-07-21T12:00:00Z' },
        },
      },
    });
    s = aplikujDeltuLokalne(s, {
      dismissedAdd: ['tip1', 'tip2'],
      journeys: {
        j1: {
          contextWorldId: 'svet-B',
          steps: { 'pj.a': '2026-07-21T11:00:00Z' },
          pausedAt: '2026-07-21T14:00:00Z',
        },
      },
    });
    expect(s.dismissed.sort()).toEqual(['tip1', 'tip2']);
    expect(s.journeys.j1.contextWorldId).toBe('svet-A');
    expect(s.journeys.j1.steps['pj.a']).toBe('2026-07-21T11:00:00Z');
    expect(s.journeys.j1.pausedAt).toBe('2026-07-21T14:00:00Z');
  });
});

describe('sloucitDelty — koalescence fronty', () => {
  it('union přírůstků, poslední skalár vyhrává, journeys po klíčích', () => {
    const out = sloucitDelty(
      { seenRoutesAdd: ['/a'], mode: 'active', journeys: { j1: { startedAt: 'X' } } },
      { seenRoutesAdd: ['/b'], mode: 'onCall', journeys: { j1: { steps: { s: 'Y' } } } },
    );
    expect(out.seenRoutesAdd?.sort()).toEqual(['/a', '/b']);
    expect(out.mode).toBe('onCall');
    expect(out.journeys?.j1).toEqual({ startedAt: 'X', steps: { s: 'Y' } });
  });
});

describe('onboardingStore', () => {
  it('persistence A→B→A: zavřený tip přežije „reload" (nový snapshot z localStorage)', () => {
    prihlasit('u1');
    onboardingStore.zavritTip('tip-x');
    expect(onboardingStore.getSnapshot().dismissed).toContain('tip-x');
    // „reload": jiná identita a zpět (store si znovu načte localStorage)
    jotai.set(currentUserAtom, null);
    void onboardingStore.getSnapshot();
    prihlasit('u1');
    expect(onboardingStore.getSnapshot().dismissed).toContain('tip-x');
  });

  it('debounce: víc mutací → JEDEN koalescovaný PATCH; fronta se po úspěchu vyčistí', async () => {
    vi.useFakeTimers();
    prihlasit('u2');
    onboardingStore.zavritTip('t1');
    onboardingStore.zavritTip('t2');
    onboardingStore.zaznamenejRoutu('/ikaros/vesmiry');
    await vi.advanceTimersByTimeAsync(2500);
    expect(api.patch).toHaveBeenCalledTimes(1);
    const body = vi.mocked(api.patch).mock.calls[0][1] as Record<string, unknown>;
    expect((body.dismissedAdd as string[]).sort()).toEqual(['t1', 't2']);
    expect(body.seenRoutesAdd).toEqual(['/ikaros/vesmiry']);
    expect(localStorage.getItem('vypravec:u2:pending')).toBe('[]');
  });

  it('selhání PATCH → fronta zůstává (re-POST příště)', async () => {
    vi.useFakeTimers();
    vi.mocked(api.patch).mockRejectedValue(new Error('offline'));
    prihlasit('u3');
    onboardingStore.zavritTip('t-off');
    await vi.advanceTimersByTimeAsync(2500);
    const pending = JSON.parse(localStorage.getItem('vypravec:u3:pending') ?? '[]');
    expect(pending).toHaveLength(1);
  });

  it('anon → login: anon dismissed se přenese deltou a anon klíče se smažou', async () => {
    jotai.set(currentUserAtom, null);
    void onboardingStore.getSnapshot(); // kontext anon
    onboardingStore.zavritTip('anon-tip');
    expect(onboardingStore.getSnapshot().dismissed).toContain('anon-tip');
    prihlasit('u4');
    void onboardingStore.getSnapshot(); // spustí přepnutí kontextu
    await Promise.resolve(); // anon-merge běží v microtasku (E14 — ne v render fázi)
    await Promise.resolve();
    expect(onboardingStore.getSnapshot().dismissed).toContain('anon-tip');
    expect(localStorage.getItem('vypravec:anon')).toBeNull();
    const pending = JSON.parse(localStorage.getItem('vypravec:u4:pending') ?? '[]');
    expect(JSON.stringify(pending)).toContain('anon-tip');
  });

  it('init: legacy účet → seed seenRoutes ze VŠECH rout + backfilled', async () => {
    vi.mocked(api.get).mockResolvedValue({ state: null, legacy: true });
    prihlasit('u5');
    await onboardingStore.init();
    const s = onboardingStore.getSnapshot();
    expect(s.backfilled).toBe(true);
    expect(s.seenRoutes.length).toBeGreaterThan(50); // celý registr
    expect(onboardingStore.jeNovy).toBe(false);
  });

  it('init: čerstvý účet → jeNovy=true (moment 1 pro D7)', async () => {
    vi.mocked(api.get).mockResolvedValue({ state: null, legacy: false });
    prihlasit('u6');
    await onboardingStore.init();
    expect(onboardingStore.jeNovy).toBe(true);
  });

  it('init: server state = základ, pending se re-aplikuje', async () => {
    prihlasit('u7');
    onboardingStore.zavritTip('lokalni-tip'); // pending
    vi.mocked(api.get).mockResolvedValue({
      state: { ...PRAZDNY, dismissed: ['serverovy-tip'], persona: 'pj' },
      legacy: false,
    });
    await onboardingStore.init();
    const s = onboardingStore.getSnapshot();
    expect(s.persona).toBe('pj');
    expect(s.dismissed).toContain('serverovy-tip');
    expect(s.dismissed).toContain('lokalni-tip');
  });

  it('flushKeepalive: fetch s keepalive+PATCH+Bearer; po ok fronta pryč', async () => {
    prihlasit('u8');
    localStorage.setItem('ikaros.jwt', JSON.stringify('tok-123'));
    onboardingStore.zavritTip('t-flush');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    onboardingStore.flushKeepalive();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/users/me/onboarding');
    expect(init.method).toBe('PATCH');
    expect(init.keepalive).toBe(true);
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer tok-123',
    );
    await Promise.resolve(); // then() vyčistí frontu
    await Promise.resolve();
    expect(localStorage.getItem('vypravec:u8:pending')).toBe('[]');
  });
});
