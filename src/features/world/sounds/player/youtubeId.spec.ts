import { describe, it, expect } from 'vitest';
import { extractYoutubeId, extractYoutubeIds } from './youtubeId';

describe('extractYoutubeId', () => {
  it('parsuje watch?v= URL', () => {
    expect(extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ',
    );
  });

  it('parsuje watch s dalšími parametry před v=', () => {
    expect(
      extractYoutubeId('https://www.youtube.com/watch?list=PL123&v=dQw4w9WgXcQ'),
    ).toBe('dQw4w9WgXcQ');
  });

  it('parsuje youtu.be zkrácené URL', () => {
    expect(extractYoutubeId('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ',
    );
  });

  it('parsuje youtu.be s časem', () => {
    expect(extractYoutubeId('https://youtu.be/dQw4w9WgXcQ?t=42')).toBe(
      'dQw4w9WgXcQ',
    );
  });

  it('parsuje embed URL', () => {
    expect(
      extractYoutubeId('https://www.youtube.com/embed/dQw4w9WgXcQ'),
    ).toBe('dQw4w9WgXcQ');
  });

  it('parsuje shorts URL', () => {
    expect(
      extractYoutubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ'),
    ).toBe('dQw4w9WgXcQ');
  });

  it('parsuje music.youtube.com', () => {
    expect(
      extractYoutubeId('https://music.youtube.com/watch?v=dQw4w9WgXcQ'),
    ).toBe('dQw4w9WgXcQ');
  });

  it('akceptuje holé 11znakové ID', () => {
    expect(extractYoutubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('ořízne mezery', () => {
    expect(extractYoutubeId('  https://youtu.be/dQw4w9WgXcQ  ')).toBe(
      'dQw4w9WgXcQ',
    );
  });

  it('vrací null pro nevalidní vstup', () => {
    expect(extractYoutubeId('https://example.com/video')).toBeNull();
    expect(extractYoutubeId('')).toBeNull();
    expect(extractYoutubeId(null)).toBeNull();
    expect(extractYoutubeId(undefined)).toBeNull();
  });
});

describe('extractYoutubeIds', () => {
  it('mapuje seznam a zahodí nevalidní', () => {
    const result = extractYoutubeIds([
      'https://youtu.be/dQw4w9WgXcQ',
      'nevalidní',
      'https://www.youtube.com/watch?v=abc12345678',
      null,
    ]);
    expect(result).toEqual(['dQw4w9WgXcQ', 'abc12345678']);
  });

  it('vrací prázdné pole pro samé nevalidní', () => {
    expect(extractYoutubeIds(['x', null, undefined])).toEqual([]);
  });
});
