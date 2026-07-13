/**
 * GURPS 4E bestie panel — testy.
 * Atribut / zásah útoku = 3k6 roll-under; škody = mixed; iniciativa = flat
 * (Základní rychlost) → token.initiative; HP z damageable (token.currentHp/maxHp).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GurpsBestiePanel } from '../GurpsBestiePanel';
import { systemEntitySchemaRegistry } from '../../../../schemas/registry';
import { gurpsSchemas } from '../../../../schemas/gurps';
import type { MapToken } from '../../../../types';

const mockMutate = vi.fn();
vi.mock('../../../../hooks/useTokenUpdate', () => ({
  useTokenUpdate: () => ({ mutate: mockMutate, isPending: false }),
}));

function makeToken(overrides: Partial<MapToken> = {}): MapToken {
  return {
    id: 't1',
    characterId: 'bestie:b1',
    characterSlug: 'b1',
    isNpc: true,
    instanceName: 'Skalní cerberus',
    q: 0,
    r: 0,
    currentHp: 22,
    maxHp: 22,
    baseHp: 22,
    armor: 0,
    baseArmor: 0,
    injury: 0,
    initiative: 0,
    initiativeBase: 0,
    inCombat: false,
    movement: 7,
    abilities: [],
    notes: '',
    customData: {},
    systemStats: {
      'attributes.st': 18,
      'attributes.dx': 12,
      'attributes.iq': 5,
      'attributes.ht': 13,
      'attributes.will': 11,
      'attributes.per': 13,
      'health.max': 22,
      dodge: 9,
      parry: 0,
      block: 0,
      dr: 3,
      basic_speed: 6.25,
      creature_type: 'Nestvůra · strážce',
      size_modifier: 1,
      movement: 7,
      damage_thrust: '2d-1',
      damage_swing: '2d+1',
      attacks: [{ name: 'Kousnutí', skill: 14, dmg: '2k+1', reach: 'C,1' }],
      abilities: [{ label: 'Silný čich', value: '' }],
      tactic: 'Blokuje cestu.',
    },
    ...overrides,
  } as MapToken;
}

const props = { sceneId: 's1', worldId: 'w1', systemId: 'gurps', canEdit: true };

beforeEach(() => {
  mockMutate.mockReset();
  systemEntitySchemaRegistry._clearForTesting();
  for (const s of gurpsSchemas) systemEntitySchemaRegistry.register(s);
});

describe('GurpsBestiePanel', () => {
  it('atribut → onMapRoll 3k6 roll-under (cíl = atribut)', () => {
    const onMapRoll = vi.fn();
    render(<GurpsBestiePanel {...props} token={makeToken()} onMapRoll={onMapRoll} />);
    fireEvent.click(screen.getByLabelText('Hod na Síla'));
    expect(onMapRoll).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'skill',
        rollerKind: 'bestie',
        dicePayload: expect.objectContaining({
          type: '3d6',
          rollUnder: expect.objectContaining({ target: 18 }),
        }),
      }),
    );
  });

  it('útok zásah → 3k6 vs dovednost', () => {
    const onMapRoll = vi.fn();
    render(<GurpsBestiePanel {...props} token={makeToken()} onMapRoll={onMapRoll} />);
    fireEvent.click(screen.getByLabelText('Kousnutí zásah'));
    expect(onMapRoll).toHaveBeenCalledWith(
      expect.objectContaining({
        dicePayload: expect.objectContaining({
          type: '3d6',
          rollUnder: expect.objectContaining({ target: 14 }),
        }),
      }),
    );
  });

  it('útok škody → mixed (d6)', () => {
    const onMapRoll = vi.fn();
    render(<GurpsBestiePanel {...props} token={makeToken()} onMapRoll={onMapRoll} />);
    fireEvent.click(screen.getByLabelText('Kousnutí škody'));
    expect(onMapRoll).toHaveBeenCalledWith(
      expect.objectContaining({
        dicePayload: expect.objectContaining({ type: 'mixed' }),
      }),
    );
  });

  it('HP −5 → hpDelta; mirror systemStats.health.current z ABSOLUTNÍ hodnoty v response', () => {
    render(<GurpsBestiePanel {...props} token={makeToken()} onMapRoll={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Životy -5'));
    // 1. volání: delta, žádný absolutní currentHp (lost-update fix)
    expect(mockMutate).toHaveBeenCalledTimes(1);
    const [vars, opts] = mockMutate.mock.calls[0];
    expect(vars).toEqual({ tokenId: 't1', hpDelta: -5 });
    // BE 201 vrací op s normalizovaným ABSOLUTNÍM patch.currentHp — jiná
    // hodnota než lokální odhad (souběžný zásah) → mirror ji musí převzít.
    opts.onSuccess({
      op: { type: 'token.update', tokenId: 't1', patch: { currentHp: 15 } },
    });
    expect(mockMutate).toHaveBeenCalledTimes(2);
    const mirror = mockMutate.mock.calls[1][0];
    expect(mirror.patch.systemStats['health.current']).toBe(15);
    expect(mirror.patch).not.toHaveProperty('currentHp');
  });

  it('iniciativa → flat (= Základní rychlost) + zapíše token.initiative', () => {
    const onMapRoll = vi.fn();
    render(<GurpsBestiePanel {...props} token={makeToken()} onMapRoll={onMapRoll} />);
    fireEvent.click(screen.getByText(/Do iniciativy/));
    expect(onMapRoll).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'initiative' }),
    );
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ patch: expect.objectContaining({ initiative: 6.25 }) }),
    );
  });
});
