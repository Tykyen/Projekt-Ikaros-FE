import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { Seo } from './Seo';

describe('Seo', () => {
  beforeEach(() => {
    document.head.querySelectorAll('meta[property], meta[name], link[rel="canonical"]').forEach((el) => el.remove());
    document.title = '';
  });

  it('nastaví document.title s brand sufixem', () => {
    render(<Seo title="Články" />);
    expect(document.title).toBe('Články | Ikaros');
  });

  it('rawTitle = titulek bez sufixu', () => {
    render(<Seo rawTitle title="Ikaros — claim" />);
    expect(document.title).toBe('Ikaros — claim');
  });

  it('vykreslí canonical, og:title a description', () => {
    render(<Seo title="X" description="popis stránky" />);
    expect(document.querySelector('link[rel="canonical"]')).toBeTruthy();
    expect(
      document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
    ).toBe('X | Ikaros');
    expect(
      document.querySelector('meta[name="description"]')?.getAttribute('content'),
    ).toBe('popis stránky');
  });

  it('noindex přidá robots meta', () => {
    render(<Seo title="X" noindex />);
    expect(
      document.querySelector('meta[name="robots"]')?.getAttribute('content'),
    ).toBe('noindex,follow');
  });

  it('bez description nevykreslí description meta', () => {
    render(<Seo title="X" />);
    expect(document.querySelector('meta[name="description"]')).toBeNull();
    expect(document.querySelector('meta[name="robots"]')).toBeNull();
  });
});
