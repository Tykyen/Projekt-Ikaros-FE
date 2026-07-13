/**
 * 16b bestie — DrdhBestiePanel testy.
 * Atribut = d10 + oprava (⌊st/2⌋−5); Útok = d6+ + ÚČ + zranění (skill);
 * Iniciativa = d6 + oprava OBR → zapíše token.initiative. HP z damageable
 * (token.currentHp/maxHp), ± mění currentHp. In-place edit + sanitizace
 * systemStats vůči drdh:token (superset → cizí klíč odfiltrován).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DrdhBestiePanel } from '../DrdhBestiePanel';
import { systemEntitySchemaRegistry } from '../../../../schemas/registry';
import { drdhSchemas } from '../../../../schemas/drdh';
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
    instanceName: 'Stínový vlk',
    q: 0,
    r: 0,
    currentHp: 18,
    maxHp: 18,
    baseHp: 18,
    armor: 0,
    baseArmor: 0,
    injury: 0,
    initiative: 0,
    initiativeBase: 0,
    inCombat: false,
    movement: 15,
    abilities: [],
    notes: '',
    customData: {},
    systemStats: {
      hp: 18,
      // Obr stupeň 15 → oprava ⌊15/2⌋−5 = 2 (iniciativa);
      // Síla stupeň 12 → oprava ⌊12/2⌋−5 = 1.
      str: 12,
      dex: 15,
      con: 13,
      int: 6,
      cha: 8,
      zo: 6,
      oc: 6,
      size: 'B',
      level: 3,
      creature_type: 'Zvíře',
      occurrence: 'Hvozd',
      xp: 120,
      attacks: [{ name: 'Kousnutí', kind: 'tlapák', uc: 7, dmg: '+2' }],
      resist: [{ kind: 'slab', label: 'Oheň' }],
      abilities: [{ name: 'Smečkový lov', desc: '+2 k útoku' }],
      tactic: 'Loví ve smečce.',
    },
    ...overrides,
  } as MapToken;
}

const props = { sceneId: 's1', worldId: 'w1', systemId: 'drdh', canEdit: true };

beforeEach(() => {
  mockMutate.mockReset();
  systemEntitySchemaRegistry._clearForTesting();
  for (const s of drdhSchemas) systemEntitySchemaRegistry.register(s);
});

describe('DrdhBestiePanel', () => {
  it('atribut → onMapRoll d10 + oprava (skill)', () => {
    const onMapRoll = vi.fn();
    render(<DrdhBestiePanel {...props} token={makeToken()} onMapRoll={onMapRoll} />);
    // Síla stupeň 12 → oprava 1.
    fireEvent.click(screen.getByLabelText('Hodit Síla'));
    expect(onMapRoll).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'skill',
        rollerKind: 'bestie',
        dicePayload: expect.objectContaining({ type: 'd10', modifier: 1 }),
      }),
    );
  });

  it('útok → onMapRoll d6+ + ÚČ + zranění (skill)', () => {
    const onMapRoll = vi.fn();
    render(<DrdhBestiePanel {...props} token={makeToken()} onMapRoll={onMapRoll} />);
    fireEvent.click(screen.getByLabelText('Útok Kousnutí'));
    expect(onMapRoll).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'skill',
        dicePayload: expect.objectContaining({
          type: 'd6+',
          modifier: 7,
          damage: '+2',
        }),
      }),
    );
  });

  it('iniciativa → d6 + oprava OBR, zapíše token.initiative', () => {
    const onMapRoll = vi.fn();
    render(<DrdhBestiePanel {...props} token={makeToken()} onMapRoll={onMapRoll} />);
    fireEvent.click(screen.getByText(/Iniciativa/));
    expect(onMapRoll).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'initiative',
        // Obr stupeň 15 → oprava 2.
        dicePayload: expect.objectContaining({ type: 'd6', modifier: 2 }),
      }),
    );
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        patch: expect.objectContaining({ initiative: expect.any(Number) }),
        skipInvalidate: true,
      }),
    );
  });

  it('HP odvozeno z damageable — Životy −1 → hpDelta (lost-update fix)', () => {
    render(<DrdhBestiePanel {...props} token={makeToken()} onMapRoll={vi.fn()} />);
    expect(screen.getByText('18 / 18')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Životy -1'));
    expect(mockMutate).toHaveBeenCalledWith({ tokenId: 't1', hpDelta: -1 });
    expect(mockMutate.mock.calls[0][0]).not.toHaveProperty('patch');
  });

  it('„✏ Upravit bestii" přepne do edit režimu (in-place inputy)', () => {
    render(<DrdhBestiePanel {...props} token={makeToken()} onMapRoll={vi.fn()} />);
    expect(screen.queryByLabelText('Jméno bestie')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('✏ Upravit bestii'));
    expect(screen.getByLabelText('Jméno bestie')).toBeInTheDocument();
    expect(screen.getByLabelText('Životy (max)')).toBeInTheDocument();
    // klikací atribut v edit režimu zmizí (input místo tlačítka)
    expect(screen.queryByLabelText('Hodit Síla')).not.toBeInTheDocument();
  });

  it('Hotovo uloží instanceName + systemStats + maxHp; sanitizuje cizí klíče', () => {
    render(
      <DrdhBestiePanel
        {...props}
        token={makeToken({
          systemStats: {
            ...makeToken().systemStats,
            cizi_klic: 'x', // mimo drdh:token schéma → odfiltrovat
          },
        })}
        onMapRoll={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('✏ Upravit bestii'));
    fireEvent.click(screen.getByText('✓ Hotovo (uložit)'));
    const call = mockMutate.mock.calls[0][0];
    expect(call.patch.instanceName).toBe('Stínový vlk');
    expect(call.patch.maxHp).toBe(18);
    expect(call.patch.systemStats).toHaveProperty('hp', 18);
    expect(call.patch.systemStats).toHaveProperty('attacks');
    expect(call.patch.systemStats).toHaveProperty('str', 12);
    expect(call.patch.systemStats).not.toHaveProperty('cizi_klic');
  });

  it('!canEdit → bez Upravit, atribut nehratelný', () => {
    const onMapRoll = vi.fn();
    render(
      <DrdhBestiePanel
        {...props}
        canEdit={false}
        token={makeToken()}
        onMapRoll={onMapRoll}
      />,
    );
    expect(screen.queryByText('✏ Upravit bestii')).not.toBeInTheDocument();
    const attr = screen.getByLabelText('Síla');
    expect(attr).toBeDisabled();
    fireEvent.click(attr);
    expect(onMapRoll).not.toHaveBeenCalled();
  });
});
