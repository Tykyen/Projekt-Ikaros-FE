/**
 * 16.2e Fáze 2 — Drd2BestiePanel testy.
 * Charakteristiky = 2d6+ + úroveň (skill); Iniciativa = 2d6+ + base → zapíše
 * iniciativu. Sudba ± mění currentHp. In-place edit + sanitizace systemStats.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Drd2BestiePanel } from '../Drd2BestiePanel';
import { systemEntitySchemaRegistry } from '../../../../schemas/registry';
import { drd2Schemas } from '../../../../schemas/drd2';
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
    templateId: 'b1',
    isNpc: true,
    instanceName: 'Olgoj chorchoj',
    q: 0,
    r: 0,
    currentHp: 14,
    maxHp: 14,
    baseHp: 14,
    armor: 0,
    baseArmor: 0,
    injury: 0,
    initiative: 0,
    initiativeBase: 2,
    inCombat: false,
    movement: 5,
    abilities: [],
    notes: '',
    customData: {},
    systemStats: {
      sudba: 14,
      telo: 7,
      duse: 3,
      vliv: 4,
      'initiative.base': 2,
      charakteristiky: [{ nazev: 'Leptání', uroven: 4 }],
      zvlastni_schopnosti: [{ nazev: 'Slíz', popis: 'jed' }],
    },
    ...overrides,
  } as MapToken;
}

const props = { sceneId: 's1', worldId: 'w1', systemId: 'drd2', canEdit: true };

beforeEach(() => {
  mockMutate.mockReset();
  systemEntitySchemaRegistry._clearForTesting();
  for (const s of drd2Schemas) systemEntitySchemaRegistry.register(s);
});

describe('Drd2BestiePanel', () => {
  it('charakteristika → onMapRoll 2d6+ + úroveň (skill)', () => {
    const onMapRoll = vi.fn();
    render(<Drd2BestiePanel {...props} token={makeToken()} onMapRoll={onMapRoll} />);
    fireEvent.click(screen.getByLabelText('Hodit Leptání'));
    expect(onMapRoll).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'skill',
        rollerKind: 'bestie',
        dicePayload: expect.objectContaining({ type: '2d6+', modifier: 4 }),
      }),
    );
  });

  it('iniciativa → 2d6+ + base, zapíše token.initiative', () => {
    const onMapRoll = vi.fn();
    render(<Drd2BestiePanel {...props} token={makeToken()} onMapRoll={onMapRoll} />);
    fireEvent.click(screen.getByText(/Iniciativa/));
    expect(onMapRoll).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'initiative',
        dicePayload: expect.objectContaining({ type: '2d6+', modifier: 2 }),
      }),
    );
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        patch: expect.objectContaining({ initiative: expect.any(Number) }),
        skipInvalidate: true,
      }),
    );
  });

  it('Sudba −1 → patch currentHp', () => {
    render(<Drd2BestiePanel {...props} token={makeToken()} onMapRoll={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Sudba -1'));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ patch: { currentHp: 13 } }),
    );
  });

  it('„✏ Upravit bestii" přepne do edit režimu (in-place inputy)', () => {
    render(<Drd2BestiePanel {...props} token={makeToken()} onMapRoll={vi.fn()} />);
    expect(screen.queryByLabelText('Jméno bestie')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('✏ Upravit bestii'));
    expect(screen.getByLabelText('Jméno bestie')).toBeInTheDocument();
    expect(screen.getByLabelText('Sudba (max)')).toBeInTheDocument();
    // klikací charakteristika v edit režimu zmizí (input místo tlačítka)
    expect(screen.queryByLabelText('Hodit Leptání')).not.toBeInTheDocument();
  });

  it('Hotovo uloží instanceName + systemStats + maxHp; sanitizuje cizí klíče', () => {
    render(
      <Drd2BestiePanel
        {...props}
        token={makeToken({
          systemStats: {
            ...makeToken().systemStats,
            cizi_klic: 'x', // mimo drd2:token schéma → odfiltrovat
          },
        })}
        onMapRoll={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('✏ Upravit bestii'));
    fireEvent.click(screen.getByText('✓ Hotovo (uložit)'));
    const call = mockMutate.mock.calls[0][0];
    expect(call.patch.instanceName).toBe('Olgoj chorchoj');
    expect(call.patch.maxHp).toBe(14);
    expect(call.patch.systemStats).toHaveProperty('sudba', 14);
    expect(call.patch.systemStats).toHaveProperty('charakteristiky');
    expect(call.patch.systemStats).not.toHaveProperty('cizi_klic');
  });

  it('!canEdit → bez Upravit, charakteristika nehratelná', () => {
    const onMapRoll = vi.fn();
    render(
      <Drd2BestiePanel
        {...props}
        canEdit={false}
        token={makeToken()}
        onMapRoll={onMapRoll}
      />,
    );
    expect(screen.queryByText('✏ Upravit bestii')).not.toBeInTheDocument();
    const char = screen.getByLabelText('Leptání');
    expect(char).toBeDisabled();
    fireEvent.click(char);
    expect(onMapRoll).not.toHaveBeenCalled();
  });
});
