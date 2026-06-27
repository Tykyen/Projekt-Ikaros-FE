/**
 * 16.2d Fáze 2 — DrdPlusBestiePanel tests.
 * Hody: BČ/ÚČ/OČ/vlastnosti = 2d6+, ZZ = d6; postih se přičítá; BČ zapíše
 * iniciativu. Wound stepper mění injury. Výdrž „—" se nehází. In-place edit.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DrdPlusBestiePanel } from '../DrdPlusBestiePanel';
import { systemEntitySchemaRegistry } from '../../../../schemas/registry';
import { drdplusSchemas } from '../../../../schemas/drdplus';
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
    instanceName: 'Požírač duší',
    q: 0,
    r: 0,
    currentHp: 7,
    maxHp: 7,
    baseHp: 7,
    armor: 2,
    baseArmor: 2,
    injury: 0,
    initiative: 0,
    initiativeBase: 0,
    inCombat: false,
    movement: 0,
    abilities: [{ name: 'Vidění duší', description: '4' }],
    notes: 'Astrální had.',
    customData: {},
    systemStats: {
      mez_zraneni: 7,
      ochrana: 2,
      postih: 0,
      utoky: [{ name: 'Tlama', bc: 4, uc: 5, oc: 4, zz: 3, type: 'B' }],
      sil: 5,
      obr: 7,
      vydrz: '—',
      rychlost: -7,
    },
    ...overrides,
  } as MapToken;
}

const props = { sceneId: 's1', worldId: 'w1', systemId: 'drdplus', canEdit: true };

beforeEach(() => {
  mockMutate.mockReset();
  systemEntitySchemaRegistry._clearForTesting();
  for (const s of drdplusSchemas) systemEntitySchemaRegistry.register(s);
});

describe('DrdPlusBestiePanel', () => {
  it('BČ → onMapRoll 2d6+ (category initiative) + zapíše iniciativu', () => {
    const onMapRoll = vi.fn();
    render(<DrdPlusBestiePanel {...props} token={makeToken()} onMapRoll={onMapRoll} />);
    fireEvent.click(screen.getByLabelText('Tlama BČ (iniciativa)'));
    expect(onMapRoll).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'initiative',
        rollerKind: 'bestie',
        dicePayload: expect.objectContaining({ type: '2d6+', modifier: 4 }),
      }),
    );
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        patch: expect.objectContaining({ initiative: expect.any(Number) }),
        skipInvalidate: true,
      }),
    );
  });

  it('ÚČ → 2d6+ skill, ZZ → d6 skill', () => {
    const onMapRoll = vi.fn();
    render(<DrdPlusBestiePanel {...props} token={makeToken()} onMapRoll={onMapRoll} />);
    fireEvent.click(screen.getByLabelText('Tlama ÚČ'));
    expect(onMapRoll).toHaveBeenLastCalledWith(
      expect.objectContaining({
        category: 'skill',
        dicePayload: expect.objectContaining({ type: '2d6+', modifier: 5 }),
      }),
    );
    fireEvent.click(screen.getByLabelText('Tlama ZZ'));
    expect(onMapRoll).toHaveBeenLastCalledWith(
      expect.objectContaining({
        dicePayload: expect.objectContaining({ type: 'd6', modifier: 3 }),
      }),
    );
  });

  it('vlastnost → 2d6+; postih se přičítá k modifieru', () => {
    const onMapRoll = vi.fn();
    render(
      <DrdPlusBestiePanel
        {...props}
        token={makeToken({
          systemStats: { ...makeToken().systemStats, sil: 5, postih: -2 },
        })}
        onMapRoll={onMapRoll}
      />,
    );
    fireEvent.click(screen.getByLabelText('Hodit Síla'));
    expect(onMapRoll).toHaveBeenCalledWith(
      expect.objectContaining({
        dicePayload: expect.objectContaining({ type: '2d6+', modifier: 3 }),
      }),
    );
  });

  it('Výdrž „—" se nehází (disabled)', () => {
    const onMapRoll = vi.fn();
    render(<DrdPlusBestiePanel {...props} token={makeToken()} onMapRoll={onMapRoll} />);
    const vydrz = screen.getByLabelText('Výdrž');
    expect(vydrz).toBeDisabled();
  });

  it('wound stepper +1 → patch injury', () => {
    render(<DrdPlusBestiePanel {...props} token={makeToken({ injury: 0 })} onMapRoll={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Zranění +1'));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ patch: { injury: 1 } }),
    );
  });

  it('„✏ Upravit bestii" přepne panel do edit režimu (in-place inputy)', () => {
    render(<DrdPlusBestiePanel {...props} token={makeToken()} onMapRoll={vi.fn()} />);
    expect(screen.queryByLabelText('Jméno bestie')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('✏ Upravit bestii'));
    expect(screen.getByLabelText('Jméno bestie')).toBeInTheDocument();
    // bojový BČ chip v edit režimu zmizí (útoky jako inputy)
    expect(screen.queryByLabelText('Tlama BČ (iniciativa)')).not.toBeInTheDocument();
  });

  it('Hotovo uloží instanceName + systemStats + notes', () => {
    render(<DrdPlusBestiePanel {...props} token={makeToken()} onMapRoll={vi.fn()} />);
    fireEvent.click(screen.getByText('✏ Upravit bestii'));
    fireEvent.click(screen.getByText('✓ Hotovo (uložit)'));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        patch: expect.objectContaining({
          instanceName: 'Požírač duší',
          systemStats: expect.objectContaining({ mez_zraneni: 7 }),
          notes: 'Astrální had.',
        }),
      }),
      expect.anything(),
    );
  });

  it('edit save sanitizuje systemStats na drdplus:token (zahodí cizí klíče)', () => {
    render(
      <DrdPlusBestiePanel
        {...props}
        token={makeToken({
          systemStats: {
            ...makeToken().systemStats,
            velikost: 5, // bestie pole mimo token schéma → musí se odfiltrovat
          },
        })}
        onMapRoll={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('✏ Upravit bestii'));
    fireEvent.click(screen.getByText('✓ Hotovo (uložit)'));
    const call = mockMutate.mock.calls[0][0];
    expect(call.patch.systemStats).not.toHaveProperty('velikost');
    expect(call.patch.systemStats).toHaveProperty('mez_zraneni', 7);
  });

  it('!canEdit → bez Upravit, hody nehratelné', () => {
    const onMapRoll = vi.fn();
    render(
      <DrdPlusBestiePanel
        {...props}
        canEdit={false}
        token={makeToken()}
        onMapRoll={onMapRoll}
      />,
    );
    expect(screen.queryByText('✏ Upravit bestii')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Tlama BČ (iniciativa)'));
    expect(onMapRoll).not.toHaveBeenCalled();
  });
});
