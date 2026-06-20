import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { getDefaultStore } from 'jotai';
import { usePrint, usePrintMode, printModeAtom } from './printMode';

afterEach(() => {
  vi.unstubAllGlobals();
  getDefaultStore().set(printModeAtom, false);
});

/** Mock samostatného tiskového okna (window.open). Zachytí zapsaný dokument. */
function mockPrintWindow() {
  const writes: string[] = [];
  const printSpy = vi.fn();
  const win = {
    document: {
      write: (s: string) => writes.push(s),
      close: vi.fn(),
      readyState: 'complete' as const,
      images: [] as HTMLImageElement[], // žádné obrázky → tisk hned
    },
    focus: vi.fn(),
    print: printSpy,
    onload: null,
  };
  return { win, writes, printSpy, html: () => writes.join('') };
}

describe('usePrintMode', () => {
  it('reflektuje printModeAtom', () => {
    const { result } = renderHook(() => usePrintMode());
    expect(result.current).toBe(false);
    act(() => getDefaultStore().set(printModeAtom, true));
    expect(result.current).toBe(true);
  });
});

describe('usePrint', () => {
  // rAF poběží synchronně → klonování + window.open proběhne hned.
  function stubSyncRaf() {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
  }

  it('bez cíle (null) je no-op — neotevře okno, print mód zůstane false', () => {
    stubSyncRaf();
    const openSpy = vi.fn();
    vi.stubGlobal('open', openSpy);

    const { result } = renderHook(() => ({
      print: usePrint(),
      mode: usePrintMode(),
    }));

    act(() => result.current.print.triggerPrint(null));

    expect(openSpy).not.toHaveBeenCalled();
    expect(result.current.mode).toBe(false);
  });

  it('tiskne klon cíle v samostatném okně a po doběhnutí vrátí print mód', async () => {
    stubSyncRaf();
    const { win, printSpy, html } = mockPrintWindow();
    vi.stubGlobal('open', vi.fn(() => win));

    const { result } = renderHook(() => ({
      print: usePrint(),
      mode: usePrintMode(),
    }));

    const target = document.createElement('div');
    target.innerHTML = '<h1>Deník Kesta</h1><p>Den 3. u Jizvy.</p>';

    await act(async () => {
      result.current.print.triggerPrint(target);
    });

    // Obsah cíle se naklonoval do tiskového okna.
    expect(html()).toContain('Deník Kesta');
    // Tisk se spustil.
    await vi.waitFor(() => expect(printSpy).toHaveBeenCalledTimes(1));
    // Po doběhnutí je print mód zase vypnutý.
    expect(result.current.mode).toBe(false);
  });

  it('REGRESE (CH-007/008): NEkopíruje CSS appky do tiskového okna', async () => {
    stubSyncRaf();
    // Do hlavního dokumentu vložíme stylesheet appky — nesmí se přenést.
    const appLink = document.createElement('link');
    appLink.rel = 'stylesheet';
    appLink.href = 'https://app.example/styles-abc.css';
    document.head.appendChild(appLink);

    const { win, html } = mockPrintWindow();
    vi.stubGlobal('open', vi.fn(() => win));

    const { result } = renderHook(() => usePrint());
    const target = document.createElement('div');
    target.innerHTML = '<p>obsah</p>';

    await act(async () => {
      result.current.triggerPrint(target);
    });

    const doc = html();
    // Žádný odkaz na stylesheet appky (to táhlo SPA layout → prázdné listy).
    expect(doc).not.toContain('styles-abc.css');
    expect(doc).not.toContain('rel="stylesheet"');
    // Tisk si nese vlastní inline <style> (čisté dokumentové CSS z printDoc.css;
    // jeho OBSAH se ve vitestu kvůli `css:false` neresolvuje přes ?raw — věcnou
    // přítomnost CSS ověřuje offline náhled scripts/print-preview a build).
    expect(doc).toContain('<style>');

    appLink.remove();
  });
});
