import { describe, it, expect } from 'vitest';
import { validateEmoteFile, MAX_EMOTE_BYTES } from './validateEmoteFile';

function makeFile(type: string, size: number): File {
  // Vytvoříme File s deklarovaným size přes Blob — testovací prostředí
  // jsdom podporuje konstrukci s typed array.
  const buf = new Uint8Array(size);
  return new File([buf], 'x', { type });
}

describe('validateEmoteFile', () => {
  it('PNG do 512 KB projde', () => {
    const f = makeFile('image/png', 100 * 1024);
    expect(validateEmoteFile(f).ok).toBe(true);
  });

  it('WebP projde', () => {
    const f = makeFile('image/webp', 10);
    expect(validateEmoteFile(f).ok).toBe(true);
  });

  it('text/plain selhá s INVALID_TYPE', () => {
    const f = makeFile('text/plain', 10);
    const r = validateEmoteFile(f);
    expect(r.ok).toBe(false);
    expect(r.error?.code).toBe('INVALID_TYPE');
  });

  it('PDF selhá', () => {
    const f = makeFile('application/pdf', 10);
    expect(validateEmoteFile(f).ok).toBe(false);
  });

  it('přesně 512 KB projde', () => {
    const f = makeFile('image/png', MAX_EMOTE_BYTES);
    expect(validateEmoteFile(f).ok).toBe(true);
  });

  it('513 KB selhá s TOO_LARGE', () => {
    const f = makeFile('image/png', MAX_EMOTE_BYTES + 1);
    const r = validateEmoteFile(f);
    expect(r.ok).toBe(false);
    expect(r.error?.code).toBe('TOO_LARGE');
  });
});
