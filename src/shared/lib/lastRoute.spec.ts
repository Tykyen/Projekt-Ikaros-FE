import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { saveLastRoute, clearLastRoute, applyStartupRestore } from './lastRoute';

const LAST = 'ikaros.lastRoute';
const JWT = 'ikaros.jwt';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('saveLastRoute — blacklist', () => {
  it('uloží smysluplnou route', () => {
    saveLastRoute('/svet/matrix/chat');
    expect(localStorage.getItem(LAST)).toBe('/svet/matrix/chat');
  });

  it('neuloží root (= výchozí dashboard)', () => {
    saveLastRoute('/');
    expect(localStorage.getItem(LAST)).toBeNull();
  });

  it('neuloží root s query (?openLogin apod.)', () => {
    saveLastRoute('/?openLogin=1');
    expect(localStorage.getItem(LAST)).toBeNull();
  });

  it('neuloží auth-flow cesty', () => {
    saveLastRoute('/reset-password?token=x');
    saveLastRoute('/email-verify');
    expect(localStorage.getItem(LAST)).toBeNull();
  });

  it('neuloží nebezpečnou cestu (open redirect)', () => {
    saveLastRoute('//evil.com');
    expect(localStorage.getItem(LAST)).toBeNull();
  });
});

describe('clearLastRoute', () => {
  it('smaže uloženou route', () => {
    localStorage.setItem(LAST, '/svet/matrix');
    clearLastRoute();
    expect(localStorage.getItem(LAST)).toBeNull();
  });
});

// Pomocníci pro nastavení běhového prostředí applyStartupRestore.
function setStandalone(on: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: on }) as never;
}
function setNavType(type: string) {
  vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
    { type } as PerformanceNavigationTiming,
  ] as never);
}
function login() {
  localStorage.setItem(JWT, JSON.stringify('a.valid.token'));
}

describe('applyStartupRestore', () => {
  it('cold open standalone PWA na rootu + přihlášený → přepíše URL na lastRoute', () => {
    setStandalone(true);
    setNavType('navigate');
    login();
    localStorage.setItem(LAST, '/svet/matrix');

    applyStartupRestore();

    expect(window.location.pathname).toBe('/svet/matrix');
  });

  it('běžný prohlížeč (ne standalone) → no-op', () => {
    setStandalone(false);
    setNavType('navigate');
    login();
    localStorage.setItem(LAST, '/svet/matrix');

    applyStartupRestore();

    expect(window.location.pathname).toBe('/');
  });

  it('refresh dashboardu (reload) → no-op', () => {
    setStandalone(true);
    setNavType('reload');
    login();
    localStorage.setItem(LAST, '/svet/matrix');

    applyStartupRestore();

    expect(window.location.pathname).toBe('/');
  });

  it('nepřihlášený → no-op', () => {
    setStandalone(true);
    setNavType('navigate');
    localStorage.setItem(LAST, '/svet/matrix');

    applyStartupRestore();

    expect(window.location.pathname).toBe('/');
  });

  it('není uložená route → no-op', () => {
    setStandalone(true);
    setNavType('navigate');
    login();

    applyStartupRestore();

    expect(window.location.pathname).toBe('/');
  });

  it('ne na rootu (deep refresh) → no-op (zachová stránku)', () => {
    window.history.replaceState(null, '', '/svet/matrix/stranky');
    setStandalone(true);
    setNavType('navigate');
    login();
    localStorage.setItem(LAST, '/svet/jiny');

    applyStartupRestore();

    expect(window.location.pathname).toBe('/svet/matrix/stranky');
  });
});
