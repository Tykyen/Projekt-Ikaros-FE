import { describe, it, expect } from 'vitest';
import { filterNabory, seatDots, seatsLabel } from './nabory';
import type { Nabor } from '@/shared/types';

const base: Nabor = {
  id: '1',
  strana: 'hledam-hrace',
  motiv: 'fantasy',
  title: 'Test',
  body: 'popis',
  mode: 'online',
  status: 'open',
  authorId: 'a',
  authorName: 'A',
  createdAtUtc: '2026-07-08T00:00:00Z',
};
const mk = (o: Partial<Nabor>): Nabor => ({ ...base, ...o });

describe('filterNabory', () => {
  it('skryje expired nábory', () => {
    const list = [mk({ id: '1', status: 'expired' }), mk({ id: '2' })];
    expect(filterNabory(list, {}).map((n) => n.id)).toEqual(['2']);
  });

  it('filtruje podle strany („vse" = obě)', () => {
    const list = [
      mk({ id: '1', strana: 'hledam-hrace' }),
      mk({ id: '2', strana: 'hledam-hru' }),
    ];
    expect(filterNabory(list, { strana: 'hledam-hru' }).map((n) => n.id)).toEqual(
      ['2'],
    );
    expect(filterNabory(list, { strana: 'vse' })).toHaveLength(2);
  });

  it('filtruje podle systému a režimu', () => {
    const list = [
      mk({ id: '1', system: 'DrD', mode: 'online' }),
      mk({ id: '2', system: 'JaD', mode: 'zivo' }),
    ];
    expect(filterNabory(list, { system: 'DrD' }).map((n) => n.id)).toEqual(['1']);
    expect(filterNabory(list, { mode: 'zivo' }).map((n) => n.id)).toEqual(['2']);
  });

  it('fulltext hledá v nadpisu i popisu', () => {
    const list = [
      mk({ id: '1', title: 'Drak', body: 'x' }),
      mk({ id: '2', title: 'y', body: 'jeskyně' }),
    ];
    expect(filterNabory(list, { query: 'drak' }).map((n) => n.id)).toEqual(['1']);
    expect(filterNabory(list, { query: 'jesky' }).map((n) => n.id)).toEqual(['2']);
  });
});

describe('seatDots / seatsLabel', () => {
  it('tečky dle obsazenosti', () => {
    expect(seatDots(2, 5)).toEqual([true, true, false, false, false]);
    expect(seatDots(undefined, undefined)).toEqual([]);
    expect(seatDots(9, 3)).toEqual([true, true, true]); // clamp
  });

  it('label nebo null', () => {
    expect(seatsLabel(3, 5)).toBe('3/5');
    expect(seatsLabel(undefined, 4)).toBe('0/4');
    expect(seatsLabel(undefined, undefined)).toBeNull();
  });
});
