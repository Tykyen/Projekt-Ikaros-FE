import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { renderPlainChatContent } from './renderPlainContent';

function renderContent(text: string) {
  return render(<div>{renderPlainChatContent(text)}</div>);
}

describe('renderPlainChatContent', () => {
  it('emoji shortcode i klikací URL zároveň', () => {
    const { container } = renderContent(':beer: mrkni https://x.cz');
    expect(container.textContent).toContain('🍺');
    expect(container.querySelector('a')?.getAttribute('href')).toBe(
      'https://x.cz',
    );
  });

  it('ASCII smajlík se stále převede', () => {
    const { container } = renderContent('ahoj :)');
    expect(container.textContent).toContain('🙂');
    expect(container.querySelectorAll('a')).toHaveLength(0);
  });

  it('samotný text bez emotů/URL projde beze změny', () => {
    const { container } = renderContent('obyčejná zpráva');
    expect(container.textContent).toBe('obyčejná zpráva');
  });

  it('N2: `:shortcode:` uvnitř URL ji NErozbije (linkify před emote)', () => {
    const { container } = renderContent('mrkni https://host.cz/:fire:/x tady');
    const a = container.querySelector('a');
    expect(a?.getAttribute('href')).toBe('https://host.cz/:fire:/x');
    expect(a?.textContent).toBe('https://host.cz/:fire:/x');
    expect(container.textContent).not.toContain('🔥');
  });

  it('N2: emote MIMO URL se stále převede', () => {
    const { container } = renderContent(':fire: a https://host.cz/x');
    expect(container.textContent).toContain('🔥');
    expect(container.querySelector('a')?.getAttribute('href')).toBe(
      'https://host.cz/x',
    );
  });
});
