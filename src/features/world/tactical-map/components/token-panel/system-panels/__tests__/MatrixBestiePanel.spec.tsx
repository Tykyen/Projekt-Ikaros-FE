/**
 * 16.2a — testy MatrixBestiePanel.
 * Pokrytí: render sekcí, HP odvozené (clamp maxHP+zbroj−zranění), zbroj pohlcuje.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { MatrixBestiePanel } from '../MatrixBestiePanel';
import type { MapToken } from '../../../../types';

vi.mock('@/features/world/tactical-map/hooks/useTokenUpdate', () => ({
  useTokenUpdate: () => ({ mutate: vi.fn(), isPending: false, reset: vi.fn() }),
}));
vi.mock('@/features/world/tactical-map/utils/rollFromSheet', () => ({
  performSheetRoll: () => ({ total: 0, dicePayload: {} }),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function makeToken(systemStats: Record<string, unknown>, over: Partial<MapToken> = {}): MapToken {
  return {
    id: 't1', characterId: 'c1', characterSlug: 'duch', q: 0, r: 0,
    isNpc: true, currentHp: 5, maxHp: 5, baseHp: 5, armor: 0, baseArmor: 0,
    injury: 0, initiative: 0, initiativeBase: 0, inCombat: false, movement: 5,
    abilities: [{ name: 'Ledový dotek', description: '4' }],
    systemStats, templateId: undefined, instanceName: 'Duch', notes: '',
    ...over,
  } as MapToken;
}

describe('MatrixBestiePanel', () => {
  it('render sekcí Zdraví / Boj / Schopnosti / Poznámky (PJ)', () => {
    render(
      <MatrixBestiePanel token={makeToken({ 'health.max': 5, armor: 0, injury: 0 })} sceneId="s1" worldId="w1" systemId="matrix" canEdit={true} />,
      { wrapper: wrapper() },
    );
    expect(screen.getByText('Zdraví')).toBeInTheDocument();
    expect(screen.getByText('Boj')).toBeInTheDocument();
    expect(screen.getByText('Schopnosti')).toBeInTheDocument();
    // schopnost v editu = input (value), ne text
    expect(screen.getByDisplayValue('Ledový dotek')).toBeInTheDocument();
  });

  // HP track: aktivní segmenty (HP segmenty mají data-mod, pips ne).
  const activeHp = (c: HTMLElement) =>
    [...c.querySelectorAll('[data-mod]')].filter((s) => s.getAttribute('data-on') === 'true').length;

  it('HP = clamp(maxHP + zbroj − zranění): zbroj pohltí → HP zůstane plné', () => {
    // max 5, zbroj 2, zranění 1 → 5+2−1=6, cap 5 → HP 5
    const { container } = render(
      <MatrixBestiePanel token={makeToken({ 'health.max': 5, armor: 2, injury: 1 })} sceneId="s1" worldId="w1" systemId="matrix" canEdit={true} />,
      { wrapper: wrapper() },
    );
    expect(activeHp(container)).toBe(5);
    expect(screen.getByText('1 / 2')).toBeInTheDocument(); // zbroj pohlcuje
  });

  it('HP klesá až po vyčerpání zbroje: zranění > zbroj', () => {
    // max 5, zbroj 2, zranění 3 → 5+2−3=4 → HP 4
    const { container } = render(
      <MatrixBestiePanel token={makeToken({ 'health.max': 5, armor: 2, injury: 3 })} sceneId="s1" worldId="w1" systemId="matrix" canEdit={true} />,
      { wrapper: wrapper() },
    );
    expect(activeHp(container)).toBe(4);
  });

  it('canEdit=false → bez Boj/Poznámky (privátní), Zdraví viditelné', () => {
    render(
      <MatrixBestiePanel token={makeToken({ 'health.max': 5, armor: 0, injury: 0 })} sceneId="s1" worldId="w1" systemId="matrix" canEdit={false} />,
      { wrapper: wrapper() },
    );
    expect(screen.getByText('Zdraví')).toBeInTheDocument();
    expect(screen.queryByText('Boj')).not.toBeInTheDocument();
    expect(screen.queryByText('Poznámky (tato instance)')).not.toBeInTheDocument();
  });
});
