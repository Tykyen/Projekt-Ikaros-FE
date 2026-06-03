import { describe, it, expect } from 'vitest';
import { preview, formatWhen } from './feedFormat';
import type { ChatFeedItem } from '../types';

function item(p: Partial<ChatFeedItem>): ChatFeedItem {
  return {
    content: '',
    isDiceRoll: false,
    attachments: [],
    ...p,
  } as unknown as ChatFeedItem;
}

describe('preview', () => {
  it('hod kostkou má přednost před textem', () => {
    expect(preview(item({ isDiceRoll: true, content: 'ignoruj' }))).toBe(
      '🎲 Hod kostkou',
    );
  });

  it('vrátí text zprávy', () => {
    expect(preview(item({ content: 'Ahoj světe' }))).toBe('Ahoj světe');
  });

  it('prázdný text s přílohou → příloha', () => {
    expect(
      preview(item({ content: '   ', attachments: [{} as never] })),
    ).toBe('📎 Příloha');
  });

  it('nic → placeholder', () => {
    expect(preview(item({ content: null }))).toBe('…');
  });
});

describe('formatWhen', () => {
  const now = new Date('2026-06-03T12:00:00Z').getTime();

  it('méně než minuta → teď', () => {
    expect(formatWhen(new Date(now - 10_000), now)).toBe('teď');
  });

  it('minuty', () => {
    expect(formatWhen(new Date(now - 5 * 60_000), now)).toBe('před 5 min');
  });

  it('hodiny', () => {
    expect(formatWhen(new Date(now - 3 * 3_600_000), now)).toBe('před 3 h');
  });

  it('dny', () => {
    expect(formatWhen(new Date(now - 2 * 86_400_000), now)).toBe('před 2 d');
  });

  it('více než týden → datum', () => {
    expect(formatWhen(new Date(now - 10 * 86_400_000), now)).toMatch(/\d/);
  });
});
