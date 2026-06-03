/**
 * Per-instance bestie panel — save schopností + poznámek v jednom patchi.
 *
 * Ověřuje, že „Uložit statblok" pošle `token.update` patch s `systemStats`,
 * `abilities` (zpět na {name,description}) a `notes` — tj. per-instance data
 * (ne sdílená šablona). Viz fix #1b/#4 v 10.2c-edit-9c rozšíření.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { BestiePanelView } from '../BestiePanelView';
import { bootstrapSchemas } from '../../../schemas/bootstrap';
import type { MapToken } from '../../../types';

const mockMutate = vi.fn();
vi.mock('@/features/world/tactical-map/hooks/useTokenUpdate', () => ({
  useTokenUpdate: () => ({ mutate: mockMutate, isPending: false }),
}));
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function makeBestieToken(overrides: Partial<MapToken> = {}): MapToken {
  return {
    id: 'tok-1',
    characterId: 'bestie:b1',
    characterSlug: 'b1',
    templateId: 'b1',
    instanceName: 'Duch',
    q: 0,
    r: 0,
    isNpc: true,
    currentHp: 5,
    maxHp: 5,
    baseHp: 5,
    armor: 0,
    baseArmor: 0,
    injury: 0,
    initiative: 0,
    initiativeBase: 0,
    inCombat: false,
    movement: 5,
    abilities: [{ name: 'Nekromancie', description: '2' }],
    notes: 'puvodni',
    systemStats: { 'health.current': 5, 'health.max': 5 },
    customData: {},
    ...overrides,
  };
}

describe('BestiePanelView — per-instance save', () => {
  beforeEach(() => {
    bootstrapSchemas();
    mockMutate.mockClear();
  });

  it('Uložit statblok pošle systemStats + abilities + notes', () => {
    const Wrapper = makeWrapper();
    render(
      <Wrapper>
        <BestiePanelView
          token={makeBestieToken()}
          sceneId="s1"
          worldId="w1"
          systemId="matrix"
          canEdit
        />
      </Wrapper>,
    );

    // Přidej druhou schopnost
    fireEvent.click(screen.getByText('+ Přidat schopnost'));
    const labelInputs = screen.getAllByLabelText('Název schopnosti');
    fireEvent.change(labelInputs[1], { target: { value: 'Mráz' } });
    const valueInputs = screen.getAllByLabelText('Hodnota schopnosti');
    fireEvent.change(valueInputs[1], { target: { value: '4' } });

    // Změň poznámky instance
    fireEvent.change(screen.getByLabelText('Poznámky instance'), {
      target: { value: 'zranený duch' },
    });

    fireEvent.click(screen.getByText('💾 Uložit statblok'));

    expect(mockMutate).toHaveBeenCalledTimes(1);
    const [arg] = mockMutate.mock.calls[0];
    expect(arg.tokenId).toBe('tok-1');
    expect(arg.patch.notes).toBe('zranený duch');
    expect(arg.patch.abilities).toEqual([
      { name: 'Nekromancie', description: '2' },
      { name: 'Mráz', description: '4' },
    ]);
    expect(arg.patch.systemStats).toMatchObject({ 'health.current': 5 });
  });

  it('prázdné schopnosti (bez názvu) se do save nepošlou', () => {
    const Wrapper = makeWrapper();
    render(
      <Wrapper>
        <BestiePanelView
          token={makeBestieToken({ abilities: [] })}
          sceneId="s1"
          worldId="w1"
          systemId="matrix"
          canEdit
        />
      </Wrapper>,
    );

    fireEvent.click(screen.getByText('+ Přidat schopnost')); // prázdný řádek
    fireEvent.click(screen.getByText('💾 Uložit statblok'));

    const [arg] = mockMutate.mock.calls[0];
    expect(arg.patch.abilities).toEqual([]);
  });
});
