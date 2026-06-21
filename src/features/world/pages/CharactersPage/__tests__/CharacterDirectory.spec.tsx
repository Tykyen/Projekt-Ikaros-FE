import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CharacterDirectory } from '../CharacterDirectory';
import { WorldRole } from '@/shared/types';

// ── Mocky ─────────────────────────────────────────────────────────

const { useDirMock, useMembersMock, useSettingsMock, useFavMock } = vi.hoisted(() => ({
  useDirMock: vi.fn(),
  useMembersMock: vi.fn(),
  useSettingsMock: vi.fn(),
  useFavMock: vi.fn(),
}));

// 9.1 — CharactersPage čte z Pages directory přes usePersonaDirectory
// (Page entity s filterem type ∈ {Postava hráče, NPC}).
vi.mock('../../api/usePersonaDirectory', () => ({
  usePersonaDirectory: useDirMock,
}));
vi.mock('../../../api/useWorldMembers', () => ({
  useWorldMembers: useMembersMock,
}));
vi.mock('../../../api/useWorldSettings', () => ({
  useWorldSettings: useSettingsMock,
}));
vi.mock('../hooks/useFavoriteCharacters', () => ({
  useFavoriteCharacters: () => useFavMock(),
}));
// Wizard v testu ignorujeme — testujeme jen adresář.
vi.mock('../../PageEditor/components/NewPageWizardModal', () => ({
  NewPageWizardModal: () => null,
}));

// ── Data ──────────────────────────────────────────────────────────

// 9.1 — PageDirectoryEntry shape (title místo name, type místo isNpc/isLocation,
// ownerUserId místo userId). Hospoda byla isLocation=true → po sjednocení
// patří do PageType 'Lokace' a v adresáři postav už není.
const ENTRIES = [
  {
    id: 'c1',
    slug: 'frodo',
    title: 'Frodo',
    type: 'Postava hráče',
    order: 0,
    updatedAt: '2026-01-01',
    ownerUserId: 'u1',
  },
  {
    id: 'c2',
    slug: 'samvis',
    title: 'Samvís',
    type: 'Postava hráče',
    order: 1,
    updatedAt: '2026-01-01',
    ownerUserId: 'u2',
  },
  {
    id: 'c3',
    slug: 'drak',
    title: 'Drak',
    type: 'NPC',
    order: 2,
    updatedAt: '2026-01-01',
  },
];

const MEMBERS = [
  { id: 'm1', role: 2, userId: 'u1', group: 'Rebelové', user: { id: 'u1', username: 'Hráč 1' } },
  { id: 'm2', role: 2, userId: 'u2', group: 'Stříbrná rota', user: { id: 'u2', username: 'Hráč 2' } },
];

const SETTINGS = {
  customGroups: ['Rebelové', 'Stříbrná rota'],
  groupColors: { 'Rebelové': '#ff0000', 'Stříbrná rota': '#c0c0c0' },
};

function makeFavMock(initial: string[] = []) {
  const favSet = new Set<string>(initial);
  return {
    favorites: favSet,
    toggle: vi.fn((slug: string) => {
      if (favSet.has(slug)) favSet.delete(slug);
      else favSet.add(slug);
    }),
    isFavorite: (slug: string) => favSet.has(slug),
  };
}

// ── Helpers ───────────────────────────────────────────────────────

function renderDir(role: WorldRole | null = WorldRole.PJ) {
  return render(
    <MemoryRouter>
      <CharacterDirectory
        worldId="world1"
        worldSlug="matrix"
        userRole={role}
      />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useDirMock.mockReturnValue({ data: ENTRIES, isLoading: false });
  useMembersMock.mockReturnValue({ data: MEMBERS });
  useSettingsMock.mockReturnValue({ data: SETTINGS });
  useFavMock.mockReturnValue(makeFavMock());
});

// ── Testy ─────────────────────────────────────────────────────────

describe('CharacterDirectory (8.2e)', () => {
  it('vykreslí 2 sekce s počty (Postavy hráčů / NPC) — Lokace už ne (9.1)', () => {
    renderDir();
    // 9.1 — sekce Lokace zrušena; Lokace jsou v /stranky (PageType Lokace),
    // adresář postav obsahuje jen PC + NPC.
    expect(
      screen.getByRole('heading', { name: 'Postavy hráčů', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'NPC', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Frodo')).toBeInTheDocument();
    expect(screen.getByText('Drak')).toBeInTheDocument();
  });

  it('u PC karty zobrazí jméno přiřazeného hráče', () => {
    renderDir();
    expect(screen.getByText('Hráč 1')).toBeInTheDocument();
    expect(screen.getByText('Hráč 2')).toBeInTheDocument();
  });

  it('PJ vidí tlačítko "Nová postava" v záhlaví', () => {
    renderDir(WorldRole.PJ);
    expect(screen.getByText('Nová postava')).toBeInTheDocument();
  });

  it('běžný hráč tlačítko "Nová postava" nevidí', () => {
    renderDir(WorldRole.Hrac);
    expect(screen.queryByText('Nová postava')).not.toBeInTheDocument();
  });

  it('filtr NPC schová sekce PC i Lokace', async () => {
    const user = userEvent.setup();
    renderDir();
    await user.click(screen.getByRole('tab', { name: 'NPC' }));
    expect(
      screen.queryByRole('heading', { name: 'Postavy hráčů', level: 2 }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Lokace', level: 2 }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'NPC', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Drak')).toBeInTheDocument();
    expect(screen.queryByText('Frodo')).not.toBeInTheDocument();
  });

  it('prázdný adresář — PJ vidí "Vytvořit první postavu"', () => {
    useDirMock.mockReturnValue({ data: [], isLoading: false });
    renderDir(WorldRole.PJ);
    expect(
      screen.getByText(/družina hrdinů tu zatím chybí/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Vytvořit postavu')).toBeInTheDocument();
  });

  it('prázdný adresář — nižší role bez tlačítka', () => {
    useDirMock.mockReturnValue({ data: [], isLoading: false });
    renderDir(WorldRole.Ctenar);
    expect(
      screen.getByText(/družina hrdinů tu zatím chybí/i),
    ).toBeInTheDocument();
    expect(screen.queryByText('Vytvořit postavu')).not.toBeInTheDocument();
  });

  it('loading state — skeleton karet (žádná data)', () => {
    useDirMock.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = renderDir();
    expect(container.querySelectorAll('[aria-hidden]').length).toBeGreaterThan(
      0,
    );
    // Karty se ještě nevykreslily
    expect(screen.queryByText('Frodo')).not.toBeInTheDocument();
  });

  it('prázdná sekce (jen PC ve světě) — NPC a Lokace se nevykreslí', () => {
    useDirMock.mockReturnValue({
      data: [ENTRIES[0], ENTRIES[1]],
      isLoading: false,
    });
    renderDir();
    expect(
      screen.getByRole('heading', { name: 'Postavy hráčů', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'NPC', level: 2 }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Lokace', level: 2 }),
    ).not.toBeInTheDocument();
  });

  // ── 8.3 — Search ──────────────────────────────────────────────
  it('search filtruje podle jména s diakritikou-neutral', async () => {
    const user = userEvent.setup();
    renderDir();
    const search = screen.getByLabelText('Hledat postavu');
    await user.type(search, 'samvis');
    // Match přes normalizaci: „Samvís" → „samvis"
    expect(screen.getByText('Samvís')).toBeInTheDocument();
    expect(screen.queryByText('Frodo')).not.toBeInTheDocument();
    expect(screen.queryByText('Drak')).not.toBeInTheDocument();
  });

  it('search bez výsledků → empty state s tlačítkem "Vymazat hledání"', async () => {
    const user = userEvent.setup();
    renderDir();
    await user.type(screen.getByLabelText('Hledat postavu'), 'xyznevidno');
    expect(
      screen.getByText('Žádná postava neodpovídá hledání.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Vymazat hledání')).toBeInTheDocument();
  });

  it('search hledá i ve jménu přiřazeného hráče', async () => {
    const user = userEvent.setup();
    renderDir();
    await user.type(screen.getByLabelText('Hledat postavu'), 'Hráč 2');
    expect(screen.getByText('Samvís')).toBeInTheDocument();
    expect(screen.queryByText('Frodo')).not.toBeInTheDocument();
  });

  // ── 8.3 — Favorites ───────────────────────────────────────────
  it('s ≥ 1 oblíbenou se objeví sekce "Oblíbené" nad ostatními', () => {
    useFavMock.mockReturnValue(makeFavMock(['frodo']));
    renderDir();
    expect(
      screen.getByRole('heading', { name: 'Oblíbené', level: 2 }),
    ).toBeInTheDocument();
  });

  it('bez oblíbených se sekce "Oblíbené" nezobrazí', () => {
    renderDir();
    expect(
      screen.queryByRole('heading', { name: 'Oblíbené', level: 2 }),
    ).not.toBeInTheDocument();
  });

  it('klik na hvězdičku zavolá toggle', async () => {
    const fav = makeFavMock();
    useFavMock.mockReturnValue(fav);
    const user = userEvent.setup();
    renderDir();
    const stars = screen.getAllByLabelText(/oblíbených/);
    await user.click(stars[0]);
    expect(fav.toggle).toHaveBeenCalled();
  });

  // ── 8.3 — Grouping ────────────────────────────────────────────
  it('groupBy toggle rozdělí PC sekci dle herních skupin', async () => {
    const user = userEvent.setup();
    renderDir();
    await user.click(screen.getByRole('button', { name: /Skupiny/ }));
    // Skupinové nadpisy z customGroups
    expect(
      screen.getByRole('heading', { name: /Rebelové/, level: 3 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Stříbrná rota/, level: 3 }),
    ).toBeInTheDocument();
  });

  it('groupBy NPC sekci nerozděluje (NPC nemá group)', async () => {
    const user = userEvent.setup();
    renderDir();
    await user.click(screen.getByRole('button', { name: /Skupiny/ }));
    // NPC zůstanou pohromadě pod sekcí „NPC"
    expect(
      screen.getByRole('heading', { name: 'NPC', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Drak')).toBeInTheDocument();
  });

  it('PC bez group spadne do "Bez skupiny" bucketu', async () => {
    useMembersMock.mockReturnValue({
      data: [
        { id: 'm1', role: 2, userId: 'u1', user: { id: 'u1', username: 'Hráč 1' } },
        { id: 'm2', role: 2, userId: 'u2', user: { id: 'u2', username: 'Hráč 2' } },
      ],
    });
    const user = userEvent.setup();
    renderDir();
    await user.click(screen.getByRole('button', { name: /Skupiny/ }));
    expect(
      screen.getByRole('heading', { name: /Bez skupiny/, level: 3 }),
    ).toBeInTheDocument();
  });
});
