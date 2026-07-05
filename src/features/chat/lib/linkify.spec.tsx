import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { linkifyText } from './linkify';

function renderNodes(text: string) {
  return render(<div>{linkifyText(text)}</div>);
}

describe('linkifyText', () => {
  it('holý text bez URL zůstane textem', () => {
    const { container } = renderNodes('ahoj světe');
    expect(container.querySelectorAll('a')).toHaveLength(0);
    expect(container.textContent).toBe('ahoj světe');
  });

  it('https URL → klikací odkaz s bezpečnými atributy', () => {
    const { container } = renderNodes('mrkni https://botland.cz/blog super');
    const a = container.querySelector('a');
    expect(a).toBeTruthy();
    expect(a?.getAttribute('href')).toBe('https://botland.cz/blog');
    expect(a?.getAttribute('target')).toBe('_blank');
    expect(a?.getAttribute('rel')).toBe('noopener noreferrer nofollow');
    expect(a?.textContent).toBe('https://botland.cz/blog');
    expect(container.textContent).toBe('mrkni https://botland.cz/blog super');
  });

  it('http také funguje', () => {
    const { container } = renderNodes('http://example.com');
    expect(container.querySelector('a')?.getAttribute('href')).toBe(
      'http://example.com',
    );
  });

  it('koncová tečka se nezahrne do URL', () => {
    const { container } = renderNodes('viz https://x.cz.');
    expect(container.querySelector('a')?.getAttribute('href')).toBe(
      'https://x.cz',
    );
    expect(container.textContent).toBe('viz https://x.cz.');
  });

  it('URL v závorce nezabere pravou závorku', () => {
    const { container } = renderNodes('(https://x.cz)');
    expect(container.querySelector('a')?.getAttribute('href')).toBe(
      'https://x.cz',
    );
    expect(container.textContent).toBe('(https://x.cz)');
  });

  it('víc URL v jednom textu', () => {
    const { container } = renderNodes('a https://one.cz b https://two.cz c');
    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute('href')).toBe('https://one.cz');
    expect(links[1].getAttribute('href')).toBe('https://two.cz');
    expect(container.textContent).toBe('a https://one.cz b https://two.cz c');
  });

  it('javascript: schéma se NElinkuje (XSS ochrana)', () => {
    const { container } = renderNodes('javascript:alert(1)');
    expect(container.querySelectorAll('a')).toHaveLength(0);
    expect(container.textContent).toBe('javascript:alert(1)');
  });

  it('data: schéma se NElinkuje', () => {
    const { container } = renderNodes('data:text/html,<script>x</script>');
    expect(container.querySelectorAll('a')).toHaveLength(0);
  });

  it('URL uvnitř textu nerozbije okolní obsah', () => {
    const { container } = renderNodes('před https://x.cz/a?b=1&c=2 po');
    expect(container.querySelector('a')?.getAttribute('href')).toBe(
      'https://x.cz/a?b=1&c=2',
    );
    expect(container.textContent).toBe('před https://x.cz/a?b=1&c=2 po');
  });

  it('userinfo v authoritě (@) se NElinkuje — phishing', () => {
    const { container } = renderNodes('https://paypal.com@evil.com/x');
    expect(container.querySelectorAll('a')).toHaveLength(0);
    expect(container.textContent).toBe('https://paypal.com@evil.com/x');
  });

  it('bidi řídicí znak v URL se NElinkuje', () => {
    const { container } = renderNodes('https://x.cz/‮evil');
    expect(container.querySelectorAll('a')).toHaveLength(0);
  });

  it('@ až v cestě (ne authoritě) je v pořádku a linkuje se', () => {
    const { container } = renderNodes('https://mastodon.cz/@user');
    expect(container.querySelector('a')?.getAttribute('href')).toBe(
      'https://mastodon.cz/@user',
    );
  });
});
