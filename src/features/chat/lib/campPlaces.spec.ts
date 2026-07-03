import { describe, it, expect } from 'vitest';
import {
  ROZCESTI_PLACES,
  ROOM_STYLES,
  placeImageUrl,
  findPlace,
  type RoomStyle,
} from './rozcestiPlaces';
import { ROZCESTI_DESCRIPTIONS, placeDescription } from './rozcestiDescriptions';

const STYLES: RoomStyle[] = ['fantasy', 'scifi', 'mystic'];

describe('rozcestiPlaces', () => {
  it('má 3 styly po 20 lokacích', () => {
    expect(ROOM_STYLES).toHaveLength(3);
    for (const style of STYLES) {
      expect(ROZCESTI_PLACES[style]).toHaveLength(20);
    }
  });

  it('lokace mají id 1–20 bez duplicit', () => {
    for (const style of STYLES) {
      const ids = ROZCESTI_PLACES[style].map((p) => p.id);
      expect(ids).toEqual(
        Array.from({ length: 20 }, (_, i) => String(i + 1)),
      );
    }
  });

  it('každá lokace má obrázek (.webp) i neprázdný popis — 60/60', () => {
    for (const style of STYLES) {
      for (const place of ROZCESTI_PLACES[style]) {
        expect(place.image).toMatch(/\.webp$/);
        expect(place.name.length).toBeGreaterThan(0);
        expect(placeDescription(style, place.id).length).toBeGreaterThan(50);
      }
    }
  });

  it('placeImageUrl — fantasy v rootu, scifi/mystic v podsložkách', () => {
    expect(placeImageUrl('fantasy', 'pohadkovy_les.webp')).toBe(
      '/images/rozcesti/pohadkovy_les.webp',
    );
    expect(placeImageUrl('scifi', 'scifi_slum.webp')).toBe(
      '/images/rozcesti/scifi/scifi_slum.webp',
    );
    expect(placeImageUrl('mystic', 'mystic_muzeum.webp')).toBe(
      '/images/rozcesti/mystic/mystic_muzeum.webp',
    );
  });

  it('findPlace vrátí lokaci dle id, undefined pro neznámé', () => {
    expect(findPlace('fantasy', '1')?.name).toBe('Pohádkový les');
    expect(findPlace('fantasy', '99')).toBeUndefined();
  });

  it('descriptions mají klíče pro všech 20 lokací každého stylu', () => {
    for (const style of STYLES) {
      expect(Object.keys(ROZCESTI_DESCRIPTIONS[style])).toHaveLength(20);
    }
  });

  it('placeDescription vrátí prázdný řetězec pro neznámou kombinaci', () => {
    expect(placeDescription('fantasy', '99')).toBe('');
  });
});
