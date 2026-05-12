import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { getDefaultStore } from 'jotai';
import { presenceStatusMapAtom } from '../store';
import { OnlineDot } from '../OnlineDot';

const store = getDefaultStore();

beforeEach(() => {
  store.set(presenceStatusMapAtom, new Map());
});

describe('OnlineDot', () => {
  it('online → aria-label="Online" + class .online', () => {
    store.set(presenceStatusMapAtom, new Map([['u1', 'online']]));
    const { getByRole } = render(<OnlineDot userId="u1" />);
    const el = getByRole('status');
    expect(el).toHaveAttribute('aria-label', 'Online');
    expect(el.className).toMatch(/online/);
  });

  it('idle → aria-label="Idle" + class .idle', () => {
    store.set(presenceStatusMapAtom, new Map([['u1', 'idle']]));
    const { getByRole } = render(<OnlineDot userId="u1" />);
    const el = getByRole('status');
    expect(el).toHaveAttribute('aria-label', 'Idle');
    expect(el.className).toMatch(/idle/);
  });

  it('offline → aria-label="Offline" + class .offline', () => {
    const { getByRole } = render(<OnlineDot userId="u1" />);
    const el = getByRole('status');
    expect(el).toHaveAttribute('aria-label', 'Offline');
    expect(el.className).toMatch(/offline/);
  });

  it('default size = md', () => {
    const { container } = render(<OnlineDot userId="u1" />);
    const span = container.querySelector('span') as HTMLElement;
    expect(span.className).toMatch(/md/);
  });

  it('size sm propaguje class', () => {
    const { container } = render(<OnlineDot userId="u1" size="sm" />);
    const span = container.querySelector('span') as HTMLElement;
    expect(span.className).toMatch(/sm/);
  });

  it('custom className propaguje', () => {
    const { container } = render(<OnlineDot userId="u1" className="custom-x" />);
    const span = container.querySelector('span') as HTMLElement;
    expect(span.className).toContain('custom-x');
  });
});
