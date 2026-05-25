import { describe, it, expect } from 'vitest';
import { mergeEmoteSets } from './mergeEmoteSets';
import type { WorldEmote } from './types';

const make = (overrides: Partial<WorldEmote>): WorldEmote => ({
  id: 'e1',
  worldId: 'w1',
  name: 'Test',
  shortcode: 'test',
  imageId: 'cloud/id',
  imageUrl: 'https://example.com/test.png',
  createdBy: 'u1',
  tags: [],
  createdAt: '2026-05-21T10:00:00.000Z',
  ...overrides,
});

describe('mergeEmoteSets', () => {
  it('prázdné vstupy vrátí prázdnou mapu', () => {
    const set = mergeEmoteSets([], []);
    expect(set.byShortcode.size).toBe(0);
  });

  it('globální emoty se vloží do mapy', () => {
    const set = mergeEmoteSets(
      [],
      [make({ shortcode: 'star', imageUrl: 'https://g.com/star.png' })],
    );
    expect(set.byShortcode.has('star')).toBe(true);
  });

  it('per-svět emoty se vloží do mapy', () => {
    const set = mergeEmoteSets(
      [make({ shortcode: 'fire', imageUrl: 'https://w.com/fire.png' })],
      [],
    );
    expect(set.byShortcode.has('fire')).toBe(true);
  });

  it('per-svět má prioritu při kolizi shortcode', () => {
    const set = mergeEmoteSets(
      [
        make({
          shortcode: 'smile',
          imageUrl: 'https://w.com/world-smile.png',
        }),
      ],
      [
        make({
          worldId: null,
          shortcode: 'smile',
          imageUrl: 'https://g.com/global-smile.png',
        }),
      ],
    );
    const url = set.byShortcode.get('smile');
    expect(url).toContain('world-smile');
    expect(url).not.toContain('global-smile');
  });

  it('shortcode klíče jsou lowercase', () => {
    const set = mergeEmoteSets(
      [make({ shortcode: 'MiXeD' })],
      [make({ worldId: null, shortcode: 'UPPER' })],
    );
    expect(set.byShortcode.has('mixed')).toBe(true);
    expect(set.byShortcode.has('upper')).toBe(true);
    expect(set.byShortcode.has('MiXeD')).toBe(false);
  });
});
