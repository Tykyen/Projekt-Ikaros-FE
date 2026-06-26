/**
 * 16.2b Fáze 2 — Drd16BestiePanel tests.
 * Iniciativa/útoky/OČ = d6+ (modifier 0 / číslo útoku / OČ), rollerKind bestie.
 * HP = standardní token (± přes useTokenUpdate).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Drd16BestiePanel } from '../Drd16BestiePanel';
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
    instanceName: 'Brouk ostnatec',
    q: 0,
    r: 0,
    currentHp: 3,
    maxHp: 3,
    baseHp: 3,
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
      hp: 3,
      defense: 7,
      attacks: [
        { name: 'ostny', value: 3 },
        { name: 'kousnutí', value: 1 },
      ],
    },
    ...overrides,
  } as MapToken;
}

const props = { sceneId: 's1', worldId: 'w1', systemId: 'drd16', canEdit: true };

beforeEach(() => mockMutate.mockReset());

describe('Drd16BestiePanel', () => {
  it('iniciativa → onMapRoll d6+ bez bonusu (modifier 0)', () => {
    const onMapRoll = vi.fn();
    render(<Drd16BestiePanel {...props} token={makeToken()} onMapRoll={onMapRoll} />);
    fireEvent.click(screen.getByTitle('Hodit iniciativu (d6+)'));
    expect(onMapRoll).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'initiative',
        rollerKind: 'bestie',
        dicePayload: expect.objectContaining({ type: 'd6+', modifier: 0 }),
      }),
    );
  });

  it('útok → onMapRoll d6+ + číslo útoku', () => {
    const onMapRoll = vi.fn();
    render(<Drd16BestiePanel {...props} token={makeToken()} onMapRoll={onMapRoll} />);
    fireEvent.click(screen.getByLabelText('Útok ostny'));
    expect(onMapRoll).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'skill',
        dicePayload: expect.objectContaining({ type: 'd6+', modifier: 3 }),
      }),
    );
  });

  it('všechny útoky se vykreslí (víc útoků)', () => {
    render(
      <Drd16BestiePanel {...props} token={makeToken()} onMapRoll={vi.fn()} />,
    );
    expect(screen.getByLabelText('Útok ostny')).toBeInTheDocument();
    expect(screen.getByLabelText('Útok kousnutí')).toBeInTheDocument();
  });

  it('OČ → onMapRoll d6+ + OČ', () => {
    const onMapRoll = vi.fn();
    render(<Drd16BestiePanel {...props} token={makeToken()} onMapRoll={onMapRoll} />);
    fireEvent.click(screen.getByLabelText('Hodit obranu'));
    expect(onMapRoll).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'skill',
        dicePayload: expect.objectContaining({ type: 'd6+', modifier: 7 }),
      }),
    );
  });

  it('HP ± upraví token.currentHp', () => {
    render(
      <Drd16BestiePanel
        {...props}
        token={makeToken({ currentHp: 3, maxHp: 3 })}
        onMapRoll={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByLabelText('Životy -1'));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ patch: { currentHp: 2 } }),
    );
  });

  it('read-only staty + popis se zobrazí (PJ reference)', () => {
    render(
      <Drd16BestiePanel
        {...props}
        token={makeToken({
          notes: 'Tvrdý pancíř, žije v bažinách.',
          systemStats: {
            hp: 3,
            defense: 7,
            attacks: [{ name: 'ostny', value: 3 }],
            resilience: 16,
            movement: 15,
            movementMode: 'hmyz',
            alignment: 'N',
            experience: 20,
            mindForce: 0,
          },
        })}
        onMapRoll={vi.fn()}
      />,
    );
    expect(screen.getByText('Vlastnosti & chování')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument(); // Odolnost
    expect(screen.getByText('hmyz')).toBeInTheDocument(); // způsob pohybu
    expect(screen.getByText('20')).toBeInTheDocument(); // Zkušenost
    expect(screen.getByText('ZSM')).toBeInTheDocument(); // i nula se ukáže
    expect(screen.getByText('Popis')).toBeInTheDocument();
    expect(
      screen.getByText('Tvrdý pancíř, žije v bažinách.'),
    ).toBeInTheDocument();
  });

  it('canEdit → „✏ Upravit bestii" otevře editační modál (celý editor)', () => {
    render(
      <Drd16BestiePanel {...props} token={makeToken()} onMapRoll={vi.fn()} />,
    );
    expect(screen.queryByText(/^Upravit:/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('✏ Upravit bestii'));
    expect(screen.getByText(/^Upravit: Brouk ostnatec/)).toBeInTheDocument();
    // modál má pole „Jméno" (jen modál, ne panel)
    expect(screen.getByLabelText('Jméno')).toBeInTheDocument();
  });

  it('!canEdit → bez Upravit, bez iniciativy, útoky nehratelné', () => {
    const onMapRoll = vi.fn();
    render(
      <Drd16BestiePanel
        {...props}
        canEdit={false}
        token={makeToken()}
        onMapRoll={onMapRoll}
      />,
    );
    expect(screen.queryByText('✏ Upravit bestii')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Hodit iniciativu (d6+)')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Útok ostny'));
    expect(onMapRoll).not.toHaveBeenCalled();
  });
});
