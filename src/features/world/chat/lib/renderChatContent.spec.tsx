import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { renderChatContent } from './renderChatContent';

const OPTS = { mentionClass: 'm', mentionSelfClass: 'ms', emoteClass: 'e' };

function r(text: string) {
  return render(<div>{renderChatContent(text, OPTS)}</div>);
}

describe('renderChatContent — linkify + emote (world)', () => {
  it('http(s) URL → klikací odkaz s bezpečnými atributy', () => {
    const { container } = r('mrkni https://svet.cz/x super');
    const a = container.querySelector('a');
    expect(a?.getAttribute('href')).toBe('https://svet.cz/x');
    expect(a?.getAttribute('target')).toBe('_blank');
    expect(a?.getAttribute('rel')).toBe('noopener noreferrer nofollow');
    expect(container.textContent).toBe('mrkni https://svet.cz/x super');
  });

  it('N2: `:shortcode:` uvnitř URL ji NErozbije (linkify před emote)', () => {
    const { container } = r('https://svet.cz/:fire:/x');
    expect(container.querySelector('a')?.getAttribute('href')).toBe(
      'https://svet.cz/:fire:/x',
    );
    expect(container.textContent).not.toContain('🔥');
  });

  it('emote MIMO URL se stále převede', () => {
    const { container } = r(':fire: a https://svet.cz/x');
    expect(container.textContent).toContain('🔥');
    expect(container.querySelector('a')?.getAttribute('href')).toBe(
      'https://svet.cz/x',
    );
  });

  it('javascript: schéma se NElinkuje (XSS ochrana)', () => {
    const { container } = r('javascript:alert(1)');
    expect(container.querySelectorAll('a')).toHaveLength(0);
  });

  it('holý text bez URL/emotů projde', () => {
    const { container } = r('obyčejná zpráva');
    expect(container.textContent).toBe('obyčejná zpráva');
    expect(container.querySelectorAll('a')).toHaveLength(0);
  });
});
