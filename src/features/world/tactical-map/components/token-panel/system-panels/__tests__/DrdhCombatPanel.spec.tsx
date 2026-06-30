/**
 * 16b — DrdhCombatPanel tests (Dračí Hlídka combat panel na mapě).
 *
 * Pokrývá:
 *   - loading / empty fallback
 *   - iniciativa → onRoll({ kind:'d6', initiative:true }) + oprava OBR
 *   - klik na vlastnost → onRoll({ kind:'d10' }) s drdhAttrMod jako modifier
 *   - klik na dovednost → onRoll({ kind:'d10' }) s (oprava atributu + stupeň);
 *     rozklad bonusu v textu (ATR oprava · výcvik +stupeň)
 *   - per-zbraň: ⚔ Útok → onRoll({ kind:'d6+', modifier:uc }); ⛨ Obrana →
 *     onRoll({ kind:'d6+', modifier:oc }); samostatný OČ button už neexistuje
 *   - per-povolání zdroj: válečník = adrenalin track, alchymista = mana+suroviny
 *   - HP ± step (debounced mutate na drdh_hp); canEdit=false → bez init/±
 *   - okno triků (modal) zobrazí profession tabulku
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { DrdhCombatPanel } from '../DrdhCombatPanel';
import type { MapToken } from '../../../../types';

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
    characterSlug: 'brann',
    q: 0,
    r: 0,
    isNpc: false,
    currentHp: 22,
    maxHp: 28,
    baseHp: 28,
    armor: 0,
    baseArmor: 0,
    injury: 0,
    initiative: 0,
    initiativeBase: 0,
    inCombat: false,
    movement: 9,
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

beforeEach(() => {
  mockDiary.mockReset();
  mockMutate.mockReset();
  vi.useFakeTimers();
});

describe('DrdhCombatPanel', () => {
  it('loading state, dokud data nedorazí', () => {
    mockDiary.mockReturnValue({ data: undefined, isLoading: true });
    render(
      <DrdhCombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getByText(/Načítám deník/)).toBeInTheDocument();
  });

  it('empty diary → fallback', () => {
    mockDiary.mockReturnValue({ data: null, isLoading: false });
    render(
      <DrdhCombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getByText(/Deník postavy nedostupný/)).toBeInTheDocument();
  });

  it('iniciativa → onRoll d6 + oprava OBR, initiative:true (neexploduje)', () => {
    // OBR stupeň 12 → oprava ⌊12/2⌋−5 = +1.
    mockDiary.mockReturnValue(diaryWith({ drdh_attr_dex: '12' }));
    const onRoll = vi.fn();
    render(
      <DrdhCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
      { wrapper: makeWrapper() },
    );
    fireEvent.click(screen.getByTitle(/Hodit iniciativu/));
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Iniciativa',
      modifier: 1,
      kind: 'd6',
      initiative: true,
    });
  });

  it('klik na vlastnost → onRoll k10 + drdhAttrMod (Síla 16 → +3)', () => {
    // SIL stupeň 16 → oprava ⌊16/2⌋−5 = +3.
    mockDiary.mockReturnValue(diaryWith({ drdh_attr_str: '16' }));
    const onRoll = vi.fn();
    render(
      <DrdhCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
      { wrapper: makeWrapper() },
    );
    fireEvent.click(screen.getByLabelText('Hodit Síla'));
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Síla',
      modifier: 3,
      kind: 'd10',
    });
  });

  it('klik na dovednost → onRoll k10 + (oprava atributu + stupeň); rozklad v textu', () => {
    // SIL 16 → oprava +3; výcvik (stupeň) 3 → součet +6.
    mockDiary.mockReturnValue(
      diaryWith({
        drdh_attr_str: '16',
        drdh_skills: JSON.stringify([
          { name: 'Atletika', attr: 'SIL', deg: '3' },
        ]),
      }),
    );
    const onRoll = vi.fn();
    render(
      <DrdhCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
      { wrapper: makeWrapper() },
    );
    // Rozklad bonusu: "SIL +3 · výcvik +3".
    expect(screen.getByText(/SIL \+3 · výcvik \+3/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Hodit Atletika'));
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Atletika',
      modifier: 6,
      kind: 'd10',
    });
  });

  it('per-zbraň útok → onRoll ÚČ (uc) + d6+ (exploduje)', () => {
    mockDiary.mockReturnValue(
      diaryWith({
        drdh_weapons: JSON.stringify([
          { name: 'Krátký meč', atk: '', dmg: '+1', def: '', uc: '7', oc: '5' },
        ]),
      }),
    );
    const onRoll = vi.fn();
    render(
      <DrdhCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
      { wrapper: makeWrapper() },
    );
    fireEvent.click(screen.getByLabelText('Útok Krátký meč'));
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Útok: Krátký meč',
      modifier: 7,
      kind: 'd6+',
    });
  });

  it('per-zbraň obrana → onRoll OČ (oc) + d6+ (exploduje)', () => {
    mockDiary.mockReturnValue(
      diaryWith({
        drdh_weapons: JSON.stringify([
          { name: 'Krátký meč', atk: '', dmg: '+1', def: '', uc: '7', oc: '5' },
        ]),
      }),
    );
    const onRoll = vi.fn();
    render(
      <DrdhCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
      { wrapper: makeWrapper() },
    );
    fireEvent.click(screen.getByLabelText('Obrana Krátký meč'));
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Obrana: Krátký meč',
      modifier: 5,
      kind: 'd6+',
    });
  });

  it('samostatný OČ button/sekce Obrana už neexistuje (obrana je per-zbraň)', () => {
    mockDiary.mockReturnValue(diaryWith({ drdh_oc: '5' }));
    render(
      <DrdhCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={vi.fn()}
      />,
      { wrapper: makeWrapper() },
    );
    expect(screen.queryByLabelText('Hodit obranu')).not.toBeInTheDocument();
    expect(screen.queryByText('Obranné číslo')).not.toBeInTheDocument();
  });

  it('válečník → adrenalin track (klik na buňku zapíše res_adr, debounced)', () => {
    mockDiary.mockReturnValue(
      diaryWith({ drdh_profession_id: 'valecnik', drdh_res_adr: '0' }),
    );
    render(
      <DrdhCombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit />,
      { wrapper: makeWrapper() },
    );
    // Adrenalin track má 20 buněk; klikneme na buňku 5.
    fireEvent.click(screen.getByLabelText('Adrenalin 5'));
    act(() => vi.advanceTimersByTime(600));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ customDataPatch: { drdh_res_adr: '5' } }),
      expect.anything(),
    );
  });

  it('alchymista → 2 bary Mana + Suroviny (žádný adrenalin track)', () => {
    mockDiary.mockReturnValue(
      diaryWith({
        drdh_profession_id: 'alchymista',
        drdh_res_mana: '8',
        drdh_res_mana_max: '12',
        drdh_res_sur: '5',
        drdh_res_sur_max: '10',
      }),
    );
    render(
      <DrdhCombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getByText('8 / 12')).toBeInTheDocument();
    expect(screen.getByText('5 / 10')).toBeInTheDocument();
    expect(screen.queryByLabelText('Adrenalin 1')).not.toBeInTheDocument();
  });

  it('zloděj → bez magického zdroje (poznámka, žádný bar/track)', () => {
    mockDiary.mockReturnValue(diaryWith({ drdh_profession_id: 'zlodej' }));
    render(
      <DrdhCombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getByText(/nemá magický zdroj/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Adrenalin 1')).not.toBeInTheDocument();
  });

  it('HP ± krok upraví drdh_hp (debounced mutate)', () => {
    mockDiary.mockReturnValue(diaryWith({ drdh_hp: '22', drdh_hp_max: '28' }));
    render(
      <DrdhCombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit />,
      { wrapper: makeWrapper() },
    );
    fireEvent.click(screen.getByLabelText('Životy -5'));
    expect(mockMutate).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(600));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ customDataPatch: { drdh_hp: '17' } }),
      expect.anything(),
    );
  });

  it('Hranice smrti auto = −(10 + oprava ODO)', () => {
    // ODO 14 → oprava ⌊14/2⌋−5 = +2 → hranice = −(10+2) = −12 (ASCII hyphen).
    mockDiary.mockReturnValue(diaryWith({ drdh_attr_con: '14' }));
    render(
      <DrdhCombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getByText('-12')).toBeInTheDocument();
  });

  it('canEdit=false → bez iniciativy a bez ± kroků', () => {
    mockDiary.mockReturnValue(diaryWith({ drdh_hp: '22', drdh_hp_max: '28' }));
    render(
      <DrdhCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit={false}
      />,
      { wrapper: makeWrapper() },
    );
    expect(screen.queryByTitle(/Hodit iniciativu/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Životy +1')).not.toBeInTheDocument();
  });

  it('okno triků → profession tabulka dle povolání', () => {
    mockDiary.mockReturnValue(
      diaryWith({
        drdh_profession_id: 'valecnik',
        drdh_w_triky: JSON.stringify([
          { name: 'Zuřivý útok', adr: '2', use: '+3 do útoku', req: '—' },
        ]),
      }),
    );
    render(
      <DrdhCombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit />,
      { wrapper: makeWrapper() },
    );
    fireEvent.click(screen.getByText(/Válečníkovy triky/));
    expect(screen.getByText('Zuřivý útok')).toBeInTheDocument();
  });
});
