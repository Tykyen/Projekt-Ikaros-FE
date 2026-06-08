import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
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

function Harness({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useBrokenLinks(ref, 'w1', 'matrix', html);
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}

function renderHtml(html: string) {
  const { container } = render(<Harness html={html} />);
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
});
