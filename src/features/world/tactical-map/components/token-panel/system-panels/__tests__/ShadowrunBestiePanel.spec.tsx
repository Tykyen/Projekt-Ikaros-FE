/**
 * Testy Shadowrun bestie panelu na mapě (data z token.systemStats, sdílené
 * jádro s chat panelem). Ověřuje render statbloku + interakce: klik na atribut
 * = SR6 pool hod (kind pool-d6), klik na fyz. box = autosave health.current.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShadowrunBestiePanel } from '../ShadowrunBestiePanel';
import type { MapToken } from '../../../../types';

const mockTokenMutate = vi.fn();
vi.mock('../../../../hooks/useTokenUpdate', () => ({
  useTokenUpdate: () => ({ mutate: mockTokenMutate, isPending: false }),
}));
const mockPerform = vi.fn(() => ({ total: 3, dicePayload: { type: 'pool-d6' } }));
vi.mock('../../../../utils/rollFromSheet', () => ({
  performSheetRoll: (req: unknown) => mockPerform(req),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

function makeToken(systemStats: Record<string, unknown>): MapToken {
  return {
    id: 't1', characterId: 'bestie:x', characterSlug: '', q: 0, r: 0, isNpc: true,
    currentHp: 11, maxHp: 11, baseHp: 11, armor: 9, baseArmor: 9, injury: 0,
    initiative: 0, initiativeBase: 0, inCombat: false, movement: 10, abilities: [],
    customData: {}, instanceName: 'Pekelný ohař', templateId: 'tmpl1', systemStats,
  } as unknown as MapToken;
}

const stats = {
  profile: 'Paranormální zvíře · Profil 4',
  'health.max': 11, 'health.current': 11, stun_max: 10, stun_cur: 0,
  defense: 9, armor: 9, movement: 10, 'initiative.base': 7,
  attr_bod: 5, attr_agi: 4, attr_rea: 3, attr_str: 4,
  attr_wil: 4, attr_log: 2, attr_int: 4, attr_cha: 3,
  weapons: [{ name: 'Skus', type: 'Blízko', dmg: '4P', pool: 9 }],
  skills: [{ name: 'Vnímání', attr: 'INT', pool: 7 }],
  powers: [{ name: 'Imunita (oheň)', desc: 'Nezraní ho oheň.' }],
};

describe('ShadowrunBestiePanel (mapa)', () => {
  beforeEach(() => {
    mockTokenMutate.mockClear();
    mockPerform.mockClear();
  });

  it('vykreslí jméno, profil, útok, dovednost i schopnost', () => {
    render(<ShadowrunBestiePanel token={makeToken(stats)} sceneId="s1" worldId="w1" canEdit />);
    expect(screen.getByText('Pekelný ohař')).toBeInTheDocument();
    expect(screen.getByText('Paranormální zvíře · Profil 4')).toBeInTheDocument();
    expect(screen.getByText('Skus')).toBeInTheDocument();
    expect(screen.getByText('Vnímání')).toBeInTheDocument();
    expect(screen.getByText('Imunita (oheň)')).toBeInTheDocument();
  });

  it('klik na útok = SR6 pool hod (kind pool-d6, pool z dat)', () => {
    const onMapRoll = vi.fn();
    render(
      <ShadowrunBestiePanel token={makeToken(stats)} sceneId="s1" worldId="w1" canEdit onMapRoll={onMapRoll} />,
    );
    fireEvent.click(screen.getByText('Skus'));
    expect(mockPerform).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'pool-d6', pool: 9 }),
    );
    expect(onMapRoll).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'skill', rollerKind: 'bestie' }),
    );
  });

  it('klik na fyz. box autosave health.current (damageable count model)', () => {
    render(<ShadowrunBestiePanel token={makeToken(stats)} sceneId="s1" worldId="w1" canEdit />);
    fireEvent.click(screen.getByLabelText('Fyzický box 1'));
    // debounce 500 ms — počkáme na flush
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(mockTokenMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            tokenId: 't1',
            patch: { systemStats: expect.objectContaining({ 'health.current': 10 }) },
          }),
          expect.anything(),
        );
        resolve();
      }, 600);
    });
  });

  it('canEdit=false → boxy disabled (žádný autosave)', () => {
    render(<ShadowrunBestiePanel token={makeToken(stats)} sceneId="s1" worldId="w1" canEdit={false} />);
    expect(screen.getByLabelText('Fyzický box 1')).toBeDisabled();
  });
});
