import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { useBrokenLinks } from '../useBrokenLinks';

// usePagesDirectory + useNavigate jsou jediné externí závislosti hooku.
// dirState měníme per test; navigateSpy ověřuje SPA navigaci.
const { navigateSpy, dirState } = vi.hoisted(() => ({
  navigateSpy: vi.fn(),
  dirState: { current: [] as { slug: string }[] },
}));

vi.mock('react-router-dom', async (orig) => {
  const actual = await orig<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateSpy };
});

vi.mock('@/features/world/pages/api/usePagesDirectory', () => ({
  usePagesDirectory: () => ({ data: dirState.current }),
}));

function Harness({
  html,
  worldSlug = 'matrix',
}: {
  html: string;
  worldSlug?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useBrokenLinks(ref, 'w1', worldSlug, html);
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}

function renderHtml(html: string, worldSlug?: string) {
  const { container } = render(<Harness html={html} worldSlug={worldSlug} />);
  return container.querySelector('a') as HTMLAnchorElement;
}

beforeEach(() => {
  navigateSpy.mockClear();
  dirState.current = [{ slug: 'svedsko' }, { slug: 'londyn' }];
});

describe('useBrokenLinks — F5 world-scope rewrite', () => {
  it('externí odkaz zůstane nedotčený (href i target)', () => {
    const a = renderHtml(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">ext</a>',
    );
    expect(a.getAttribute('href')).toBe('https://example.com');
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.classList.contains('brokenLink')).toBe(false);
  });

  it('holý slug existující → world-scoped href, bez target, SPA navigace', () => {
    const a = renderHtml(
      '<a href="svedsko" target="_blank" rel="noopener noreferrer nofollow">Švédsko</a>',
    );
    expect(a.getAttribute('href')).toBe('/svet/matrix/svedsko');
    expect(a.getAttribute('target')).toBeNull();
    expect(a.getAttribute('rel')).toBeNull();
    expect(a.classList.contains('brokenLink')).toBe(false);

    fireEvent.click(a);
    expect(navigateSpy).toHaveBeenCalledWith('/svet/matrix/svedsko');
  });

  it('root-relativní /slug existující → world-scoped href', () => {
    const a = renderHtml('<a href="/londyn">Londýn</a>');
    expect(a.getAttribute('href')).toBe('/svet/matrix/londyn');
    fireEvent.click(a);
    expect(navigateSpy).toHaveBeenCalledWith('/svet/matrix/londyn');
  });

  it('už world-scoped odkaz je idempotentní', () => {
    const a = renderHtml('<a href="/svet/matrix/svedsko">Švédsko</a>');
    expect(a.getAttribute('href')).toBe('/svet/matrix/svedsko');
    fireEvent.click(a);
    expect(navigateSpy).toHaveBeenCalledWith('/svet/matrix/svedsko');
  });

  it('hash/kotva se při přepisu zachová', () => {
    const a = renderHtml('<a href="svedsko#dejiny">Dějiny Švédska</a>');
    expect(a.getAttribute('href')).toBe('/svet/matrix/svedsko#dejiny');
  });

  it('neexistující slug → .brokenLink + klik blokován (žádná navigace)', () => {
    const a = renderHtml('<a href="atlantida">Atlantida</a>');
    expect(a.classList.contains('brokenLink')).toBe(true);
    fireEvent.click(a);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('reserved world routa (pravidla) se nepřepisuje ani neoznačí jako broken', () => {
    const a = renderHtml('<a href="pravidla">Pravidla</a>');
    expect(a.getAttribute('href')).toBe('pravidla');
    expect(a.classList.contains('brokenLink')).toBe(false);
  });

  it('Ctrl/Cmd klik na validní odkaz nechá browseru (žádná SPA navigace)', () => {
    const a = renderHtml('<a href="svedsko">Švédsko</a>');
    fireEvent.click(a, { ctrlKey: true });
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('odkaz přidaný do DOM až po renderu (async obsah) se přepíše přes MutationObserver', async () => {
    // simuluje TipTap/async render: container je při běhu efektu prázdný,
    // odkaz se objeví později → bez observeru by zůstal nepřepsaný (404 po refreshi).
    const { container } = render(<Harness html="<p>zatím bez odkazů</p>" />);
    const div = container.querySelector('div') as HTMLDivElement;
    const a = document.createElement('a');
    a.setAttribute('href', 'svedsko');
    a.textContent = 'Švédsko';
    div.appendChild(a);
    await waitFor(() =>
      expect(a.getAttribute('href')).toBe('/svet/matrix/svedsko'),
    );
  });
});

describe('useBrokenLinks — F5 krok 3 (Matrix legacy odkazy)', () => {
  beforeEach(() => {
    dirState.current = [
      { slug: 'svedsko' },
      { slug: 'londyn' },
      { slug: 'abi' },
      { slug: 'jakuza' },
      { slug: 'undarbunndr' },
    ];
  });

  it('A1: absolutní odkaz na starý web s existujícím cílem → world-scoped href + SPA navigace', () => {
    const a = renderHtml(
      '<a href="https://www.projekt-ikaros.com/svedsko" target="_self">Švédsko</a>',
    );
    expect(a.getAttribute('href')).toBe('/svet/matrix/svedsko');
    expect(a.getAttribute('target')).toBeNull();
    expect(a.classList.contains('brokenLink')).toBe(false);
    fireEvent.click(a);
    expect(navigateSpy).toHaveBeenCalledWith('/svet/matrix/svedsko');
  });

  it('A1: bez www i přes http → také se zachytí', () => {
    const a = renderHtml('<a href="http://projekt-ikaros.com/londyn">Londýn</a>');
    expect(a.getAttribute('href')).toBe('/svet/matrix/londyn');
  });

  it('A1: starý web s propadlým cílem → .brokenLink + klik blokován (neotevře starý web)', () => {
    const a = renderHtml(
      '<a href="https://www.projekt-ikaros.com/boj-s-programy">Boj s programy</a>',
    );
    expect(a.classList.contains('brokenLink')).toBe(true);
    fireEvent.click(a);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('A1: hash za absolutním odkazem se zachová', () => {
    const a = renderHtml(
      '<a href="https://www.projekt-ikaros.com/svedsko#dejiny">Dějiny</a>',
    );
    expect(a.getAttribute('href')).toBe('/svet/matrix/svedsko#dejiny');
  });

  it('A2: přejmenovaný slug (přezdívka) přes starý web → kanonický cíl', () => {
    const a = renderHtml(
      '<a href="https://www.projekt-ikaros.com/abigail-wattson">Abi</a>',
    );
    expect(a.getAttribute('href')).toBe('/svet/matrix/abi');
    fireEvent.click(a);
    expect(navigateSpy).toHaveBeenCalledWith('/svet/matrix/abi');
  });

  it('A2: přejmenovaný slug i v holé formě → kanonický cíl', () => {
    const a = renderHtml('<a href="abigail-wattson">Abi</a>');
    expect(a.getAttribute('href')).toBe('/svet/matrix/abi');
  });

  it('A3: starý AKJ slug → přesměruje na vlastníka záložky (holá forma)', () => {
    const a = renderHtml('<a href="akj-8-jakuza">Jakuza AKJ</a>');
    expect(a.getAttribute('href')).toBe('/svet/matrix/jakuza');
    fireEvent.click(a);
    expect(navigateSpy).toHaveBeenCalledWith('/svet/matrix/jakuza');
  });

  it('A3: starý AKJ slug i přes absolutní odkaz na starý web', () => {
    const a = renderHtml(
      '<a href="https://www.projekt-ikaros.com/akj-8-jakuza">Jakuza</a>',
    );
    expect(a.getAttribute('href')).toBe('/svet/matrix/jakuza');
  });

  it('A3: AKJ bez F4d záznamu, ale s živým cílem v názvu → fallback heuristika', () => {
    const a = renderHtml('<a href="akj-15-undarbunndr">Undarbunndr AKJ</a>');
    expect(a.getAttribute('href')).toBe('/svet/matrix/undarbunndr');
  });

  it('A3: AKJ bez dohledaného vlastníka (gm01) → zůstane broken', () => {
    const a = renderHtml('<a href="gm01">GM</a>');
    expect(a.classList.contains('brokenLink')).toBe(true);
    fireEvent.click(a);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('jiný svět: shim se neaplikuje, odkaz na starý web zůstane externí', () => {
    const a = renderHtml(
      '<a href="https://www.projekt-ikaros.com/svedsko" target="_blank">x</a>',
      'jiny-svet',
    );
    expect(a.getAttribute('href')).toBe('https://www.projekt-ikaros.com/svedsko');
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.classList.contains('brokenLink')).toBe(false);
  });
});
