/**
 * 16.2d-mapa — DrdPlusCombatPanel tests.
 *
 * Pokrývá:
 *   - loading / empty fallback
 *   - hlavní vlastnost / odvozená / dovednost / zbraň BČ → onRoll '2d6+'
 *   - zbraň ZZ → onRoll 'd6' (1k6, ne eskalující)
 *   - Velikost / Hmotnost se NEhází (žádné roll tlačítko)
 *   - postih (zranění + únava) se auto-odečítá od modifieru každého hodu
 *   - iniciativa → '2d6+'
 *   - Kněz: klik Síla aspektu → '2d6+'; okno se otevře jen když data existují
 *   - canEdit=false → postih/magenergie disabled
 *   - postih edit → debounced mutate (drdp_zraneni_postih)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { DrdPlusCombatPanel } from '../DrdPlusCombatPanel';
import type { MapToken } from '../../../../types';
import type { SystemSheetProps } from '@/features/world/pages/CharacterDetailPage/diary-systems/types';

const mockDiary = vi.fn();
vi.mock('@/features/world/pages/api/useCharacterSubdocs', () => ({
  useCharacterDiary: (worldId: string, slug: string) => mockDiary(worldId, slug),
}));

const mockMutate = vi.fn();
vi.mock('@/features/world/pages/api/useCharacterMutations', () => ({
  useUpdateCharacterDiary: () => ({ mutate: mockMutate }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

function makeToken(overrides: Partial<MapToken> = {}): MapToken {
  return {
    id: 't1',
    characterId: 'c1',
    characterSlug: 'hero',
    q: 0,
    r: 0,
    isNpc: false,
    currentHp: 21,
    maxHp: 34,
    baseHp: 34,
    armor: 0,
    baseArmor: 0,
    injury: 0,
    initiative: 0,
    initiativeBase: 0,
    inCombat: false,
    movement: 13,
    abilities: [],
    customData: {},
    ...overrides,
  };
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function diaryWith(customData: Record<string, unknown>) {
  return {
    data: {
      id: 'd1',
      characterId: 'c1',
      worldId: 'w1',
      sections: [],
      customData,
    },
    isLoading: false,
  };
}

function renderPanel(onRoll?: SystemSheetProps['onRoll'], canEdit = true) {
  return render(
    <DrdPlusCombatPanel
      token={makeToken()}
      sceneId="s1"
      worldId="w1"
      canEdit={canEdit}
      onRoll={onRoll}
    />,
    { wrapper: makeWrapper() },
  );
}

beforeEach(() => {
  mockDiary.mockReset();
  mockMutate.mockReset();
  vi.useFakeTimers();
});

describe('DrdPlusCombatPanel', () => {
  it('loading state, dokud data nedorazí', () => {
    mockDiary.mockReturnValue({ data: undefined, isLoading: true });
    renderPanel();
    expect(screen.getByText(/Načítám deník/)).toBeInTheDocument();
  });

  it('empty diary → fallback', () => {
    mockDiary.mockReturnValue({ data: null, isLoading: false });
    renderPanel();
    expect(screen.getByText(/Deník postavy nedostupný/)).toBeInTheDocument();
  });

  it('hlavní vlastnost → onRoll 2d6+ + síla', () => {
    mockDiary.mockReturnValue(diaryWith({ drdp_stat_Síla: '3' }));
    const onRoll = vi.fn();
    renderPanel(onRoll);
    fireEvent.click(screen.getByLabelText('Hodit Síla'));
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Síla',
      modifier: 3,
      kind: '2d6+',
    });
  });

  it('zbraň BČ → 2d6+, ZZ → d6 (1k6)', () => {
    mockDiary.mockReturnValue(
      diaryWith({
        drdp_zbrane: JSON.stringify([
          { zbran: 'Meč', bc: 5, uc: 7, zz: 4, oc: 6 },
        ]),
      }),
    );
    const onRoll = vi.fn();
    renderPanel(onRoll);

    fireEvent.click(screen.getByLabelText('Hodit Meč — BČ'));
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Meč — BČ',
      modifier: 5,
      kind: '2d6+',
      initiative: true, // BČ určuje iniciativu
    });

    fireEvent.click(screen.getByLabelText('Hodit Meč — ZZ'));
    expect(onRoll).toHaveBeenLastCalledWith({
      label: 'Meč — ZZ',
      modifier: 4,
      kind: 'd6',
    });
  });

  it('dovednost → onRoll 2d6+ + Bonus', () => {
    mockDiary.mockReturnValue(
      diaryWith({
        drdp_dovednosti: JSON.stringify([{ dovednost: 'Léčení', bonus: 3 }]),
      }),
    );
    const onRoll = vi.fn();
    renderPanel(onRoll);
    fireEvent.click(screen.getByLabelText('Hodit Léčení'));
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Léčení',
      modifier: 3,
      kind: '2d6+',
    });
  });

  it('Velikost a Hmotnost se nehází (žádné roll tlačítko)', () => {
    mockDiary.mockReturnValue(
      diaryWith({ drdp_odv_Velikost: 'B', drdp_odv_Hmotnost: '80' }),
    );
    renderPanel(vi.fn());
    expect(screen.queryByLabelText('Hodit Velikost')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Hodit Hmotnost')).not.toBeInTheDocument();
  });

  it('postih (zranění + únava) se odečte od modifieru', () => {
    mockDiary.mockReturnValue(
      diaryWith({
        drdp_stat_Síla: '3',
        drdp_zraneni_postih: '-2',
        drdp_unava_postih: '-1',
      }),
    );
    const onRoll = vi.fn();
    renderPanel(onRoll);
    fireEvent.click(screen.getByLabelText('Hodit Síla'));
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Síla',
      modifier: 0, // 3 + (-2) + (-1)
      kind: '2d6+',
    });
  });

  it('Boj → onRoll 2d6+ + Boj (s postihem), nese iniciativu', () => {
    mockDiary.mockReturnValue(
      diaryWith({ drdp_boj_b: '4', drdp_unava_postih: '-1' }),
    );
    const onRoll = vi.fn();
    renderPanel(onRoll);
    fireEvent.click(screen.getByRole('button', { name: '⚡ Boj' }));
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Boj',
      modifier: 3, // 4 (Boj) + (-1) postih
      kind: '2d6+',
      initiative: true,
    });
  });

  it('Kněz: Síla aspektu → 2d6+; okno Zázračné schopnosti jen s daty', () => {
    mockDiary.mockReturnValue(
      diaryWith({
        drdp_profession: 'knez',
        drdp_pri_silaas: '6',
        drdp_pri_zazraky: JSON.stringify([{ name: 'Požehnání' }]),
      }),
    );
    const onRoll = vi.fn();
    renderPanel(onRoll);
    fireEvent.click(screen.getByLabelText('Hodit Síla aspektu'));
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Síla aspektu',
      modifier: 6,
      kind: '2d6+',
    });
    expect(
      screen.getByRole('button', { name: /Zázračné schopnosti/ }),
    ).toBeInTheDocument();
  });

  it('canEdit=false → postih a magenergie disabled', () => {
    mockDiary.mockReturnValue(
      diaryWith({ drdp_profession: 'carodej', drdp_wiz_aktualni: '12' }),
    );
    renderPanel(vi.fn(), false);
    expect(screen.getByLabelText('Postih za zranění')).toBeDisabled();
    expect(screen.getByLabelText('Aktuální magenergie')).toBeDisabled();
  });

  it('úprava postihu → debounced mutate (drdp_zraneni_postih)', () => {
    mockDiary.mockReturnValue(diaryWith({ drdp_zraneni_postih: '0' }));
    renderPanel(vi.fn(), true);
    fireEvent.change(screen.getByLabelText('Postih za zranění'), {
      target: { value: '-3' },
    });
    expect(mockMutate).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(600));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ customDataPatch: { drdp_zraneni_postih: -3 } }),
      expect.anything(),
    );
  });
});
