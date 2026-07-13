import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { MapToken } from '../../../../types';
import { CocBestiePanel } from '../CocBestiePanel';
import { parseCocDamage } from '../CocBestieCombatActions';

const mockMutate = vi.fn();
vi.mock('../../../../hooks/useTokenUpdate', () => ({
  useTokenUpdate: () => ({ mutate: mockMutate, isPending: false }),
}));

function makeToken(overrides: Partial<MapToken> = {}): MapToken {
  return {
    id: 't1',
    characterId: 'c1',
    characterSlug: 'slug',
    instanceName: 'Ghúl',
    q: 0,
    r: 0,
    isNpc: true,
    currentHp: 13,
    maxHp: 13,
    baseHp: 13,
    armor: 0,
    baseArmor: 0,
    injury: 0,
    initiative: 0,
    initiativeBase: 0,
    inCombat: false,
    movement: 0,
    abilities: [],
    customData: {},
    systemStats: {
      creature_type: 'Nemrtvý',
      'characteristics.str': 115,
      'characteristics.dex': 65,
      'sanity_loss.on_seeing': '0/1K6',
      'sanity_loss.on_attack': '1/1K6',
      attacks: [{ name: 'Pařát', skill: 30, dmg: '1K6', special: '2× za kolo' }],
    },
    ...overrides,
  } as MapToken;
}

beforeEach(() => {
  mockMutate.mockReset();
});

describe('CocBestiePanel', () => {
  it('vyrenderuje typ, jméno, vlastnosti, SAN loss a útok', () => {
    render(
      <CocBestiePanel token={makeToken()} sceneId="s1" worldId="w1" canEdit onMapRoll={() => {}} />,
    );
    expect(screen.getByText('Nemrtvý')).toBeInTheDocument();
    expect(screen.getByText('Ghúl')).toBeInTheDocument();
    expect(screen.getByText('SIL')).toBeInTheDocument();
    expect(screen.getByText('Ztráta příčetnosti')).toBeInTheDocument();
    expect(screen.getByText('0/1K6')).toBeInTheDocument();
    expect(screen.getByText('Pařát')).toBeInTheDocument();
  });

  it('klik na vlastnost volá onMapRoll (bestie, skill)', () => {
    const onMapRoll = vi.fn();
    render(
      <CocBestiePanel token={makeToken()} sceneId="s1" worldId="w1" canEdit onMapRoll={onMapRoll} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Hod Síla' }));
    expect(onMapRoll).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'skill', rollerKind: 'bestie', rollerName: 'Ghúl' }),
    );
  });

  it('klik na útok volá onMapRoll (zásah)', () => {
    const onMapRoll = vi.fn();
    render(
      <CocBestiePanel token={makeToken()} sceneId="s1" worldId="w1" canEdit onMapRoll={onMapRoll} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Pařát zásah' }));
    expect(onMapRoll).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'skill', rollerKind: 'bestie' }),
    );
  });

  it('HP −1 → hpDelta; mirror systemStats health.current z ABSOLUTNÍ hodnoty v response', () => {
    render(
      <CocBestiePanel token={makeToken()} sceneId="s1" worldId="w1" canEdit onMapRoll={() => {}} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Životy -1' }));
    // 1. volání: delta, žádný absolutní currentHp (lost-update fix)
    expect(mockMutate).toHaveBeenCalledTimes(1);
    const [vars, opts] = mockMutate.mock.calls[0];
    expect(vars).toEqual({ tokenId: 't1', hpDelta: -1 });
    // BE 201 vrací op s normalizovaným ABSOLUTNÍM patch.currentHp — jiná
    // hodnota než lokální odhad (souběžný zásah) → mirror ji musí převzít.
    opts.onSuccess({
      op: { type: 'token.update', tokenId: 't1', patch: { currentHp: 5 } },
    });
    expect(mockMutate).toHaveBeenCalledTimes(2);
    const mirror = mockMutate.mock.calls[1][0];
    expect(mirror.patch.systemStats['health.current']).toBe(5);
    expect(mirror.patch).not.toHaveProperty('currentHp');
  });

  it('bez onMapRoll (read-only) nejsou vlastnosti klikací', () => {
    render(<CocBestiePanel token={makeToken()} sceneId="s1" worldId="w1" canEdit={false} />);
    expect(screen.getByRole('button', { name: 'Hod Síla' })).toBeDisabled();
  });
});

describe('parseCocDamage', () => {
  it('parsuje XKY na mixed', () => {
    expect(parseCocDamage('1K6')).toEqual({ counts: { d6: 1 }, mod: 0 });
    expect(parseCocDamage('2K6+2')).toEqual({ counts: { d6: 2 }, mod: 2 });
    expect(parseCocDamage('1K10')).toEqual({ counts: { d10: 1 }, mod: 0 });
  });
  it('ignoruje nečíselný „+BZ" (hodí jen kostku)', () => {
    expect(parseCocDamage('1K6+BZ')).toEqual({ counts: { d6: 1 }, mod: 0 });
  });
  it('vrací null pro nepodporované (d3) nebo text', () => {
    expect(parseCocDamage('1K3')).toBeNull();
    expect(parseCocDamage('speciální')).toBeNull();
  });
});
