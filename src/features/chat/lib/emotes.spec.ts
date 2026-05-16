import { describe, it, expect } from 'vitest';
import { parseEmotes, EMOTES } from './emotes';

describe('parseEmotes', () => {
  it('nahradí známý shortcode emoji', () => {
    expect(parseEmotes('dáme :beer:')).toBe('dáme 🍺');
  });

  it('neznámý shortcode nechá beze změny', () => {
    expect(parseEmotes('co je :neexistuje:?')).toBe('co je :neexistuje:?');
  });

  it('je case-insensitive', () => {
    expect(parseEmotes(':BEER: a :Dice:')).toBe(`${EMOTES.beer} a ${EMOTES.dice}`);
  });

  it('nahradí více shortcodů v jednom textu', () => {
    expect(parseEmotes(':fire::fire: hoří :skull:')).toBe('🔥🔥 hoří 💀');
  });

  it('text bez shortcodů vrátí beze změny', () => {
    expect(parseEmotes('obyčejná zpráva')).toBe('obyčejná zpráva');
  });

  it('osamocený dvojtečkový text se nezmění', () => {
    expect(parseEmotes('poměr 2:1 v zápase')).toBe('poměr 2:1 v zápase');
  });
});
