import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { useAutoLink } from '../useAutoLink';

const { dirState } = vi.hoisted(() => ({
  dirState: { current: [] as Array<{ slug: string; title: string; type: string }> },
}));

vi.mock('@/features/world/pages/api/usePagesDirectory', () => ({
  usePagesDirectory: () => ({ data: dirState.current }),
}));

function Harness({ html, current }: { html: string; current: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useAutoLink(ref, 'w1', 'matrix', current, html);
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}

function renderHtml(html: string, current = 'aktualni-stranka') {
  const { container } = render(<Harness html={html} current={current} />);
  return container.querySelector('div') as HTMLDivElement;
}

beforeEach(() => {
  dirState.current = [
    { slug: 'britanie', title: 'Británie', type: 'Lokace' },
    { slug: 'havran', title: 'Havran', type: 'NPC' },
    { slug: 'prvni-valka', title: 'První magická válka', type: 'Ostatní' },
    { slug: 'technologie', title: 'Technologie', type: 'Ostatní' }, // blacklist
  ];
});

describe('useAutoLink — auto-link zmínek entit', () => {
  it('zmínka entity v textu → world-scoped <a data-autolink>', () => {
    const div = renderHtml('<p>Cestoval do Británie a zpět.</p>');
    const a = div.querySelector('a[data-autolink]') as HTMLAnchorElement;
    expect(a).toBeTruthy();
    expect(a.getAttribute('href')).toBe('/svet/matrix/britanie');
    expect(a.textContent).toBe('Británie');
  });

  it('víceslovný název se zalinkuje celý', () => {
    const div = renderHtml('<p>Vypukla První magická válka v roce 2001.</p>');
    const a = div.querySelector('a[data-autolink]') as HTMLAnchorElement;
    expect(a?.getAttribute('href')).toBe('/svet/matrix/prvni-valka');
    expect(a?.textContent).toBe('První magická válka');
  });

  it('obecné slovo na blacklistu se NEzalinkuje', () => {
    const div = renderHtml('<p>Moderní technologie změnila svět.</p>');
    // "technologie" malé — case-sensitive, ale i "Technologie" velké je blacklist
    const div2 = renderHtml('<p>Technologie změnila svět.</p>');
    expect(div.querySelector('a[data-autolink]')).toBeNull();
    expect(div2.querySelector('a[data-autolink]')).toBeNull();
  });

  it('jen 1. výskyt entity na stránce', () => {
    const div = renderHtml('<p>Británie a zase Británie a potřetí Británie.</p>');
    expect(div.querySelectorAll('a[data-autolink]')).toHaveLength(1);
  });

  it('self odkaz se nevytvoří', () => {
    const div = renderHtml('<p>Británie je krásná.</p>', 'britanie');
    expect(div.querySelector('a[data-autolink]')).toBeNull();
  });

  it('text uvnitř existujícího odkazu se nezdvojuje', () => {
    const div = renderHtml('<p>Odkaz na <a href="/x">Británie</a> tady.</p>');
    expect(div.querySelectorAll('a[data-autolink]')).toHaveLength(0);
    expect(div.querySelectorAll('a')).toHaveLength(1); // jen původní
  });

  it('case-sensitive — malé písmeno se nezalinkuje', () => {
    const div = renderHtml('<p>velká británie není odkaz.</p>');
    expect(div.querySelector('a[data-autolink]')).toBeNull();
  });

  it('async přidaný obsah (MutationObserver) se zalinkuje', async () => {
    const { container } = render(<Harness html="<p>zatím nic</p>" current="x" />);
    const div = container.querySelector('div') as HTMLDivElement;
    const p = document.createElement('p');
    p.textContent = 'Pak přišel Havran.';
    div.appendChild(p);
    await waitFor(() =>
      expect(div.querySelector('a[data-autolink]')?.getAttribute('href')).toBe('/svet/matrix/havran'),
    );
  });
});
