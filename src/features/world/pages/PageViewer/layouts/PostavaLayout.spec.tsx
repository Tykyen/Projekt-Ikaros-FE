/**
 * Bug fix (testeři) — horní „Hotovo" v hlavičce PostavaLayoutu musí
 * rozeditovaný subdoc tab ULOŽIT a zavřít edit, ne otevřít discard dialog.
 *
 * Mechanika: každý subdoc tab si přes `onProvideSave` zaregistruje async save
 * (resolve true=OK / false=fail). Horní „Hotovo" při dirty zavolá ten save;
 * po úspěchu (true) zavře edit, při chybě (false) zůstane v editu.
 */
import React, { useCallback, useEffect } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WorldRole } from '@/shared/types';
import type { Page } from '../../api/pages.types';

// ── Mock externích závislostí PostavaLayoutu ───────────────────────────
const currentUser = { id: 'u1', username: 'Tester' };

// `useBlocker` vyžaduje data router; v unit testu ho mockneme na „unblocked".
// `Link` = prostý anchor (bez routeru). Discard guard přes blocker tu neřešíme
// — testujeme jen horní „Hotovo".
vi.mock('react-router-dom', async (orig) => {
  const actual = await orig<typeof import('react-router-dom')>();
  return {
    ...actual,
    useBlocker: () => ({ state: 'unblocked', reset: vi.fn(), proceed: vi.fn() }),
    Link: ({ children, ...rest }: { children: React.ReactNode }) => (
      <a {...rest}>{children}</a>
    ),
  };
});

vi.mock('jotai', async (orig) => {
  const actual = await orig<typeof import('jotai')>();
  return { ...actual, useAtomValue: () => currentUser };
});
vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({
    worldId: 'w1',
    worldSlug: 'svet',
    userRole: WorldRole.PJ,
  }),
}));
vi.mock('../../api/useCharacter', () => ({
  useCharacter: () => ({ data: { id: 'c1' } }),
}));
vi.mock('@/features/world/api/useWorldSettings', () => ({
  useWorldSettings: () => ({ data: undefined }),
}));
vi.mock('@/features/world/api/useWorldMembers', () => ({
  useWorldMembers: () => ({ data: [] }),
}));
vi.mock('@/features/world/export/print', () => ({
  usePrint: () => ({ triggerPrint: vi.fn() }),
}));
vi.mock('@tanstack/react-query', async (orig) => {
  const actual = await orig<typeof import('@tanstack/react-query')>();
  return { ...actual, useIsFetching: () => 0 };
});
// AkjBanner dělá vlastní useQuery (pages directory) — v testu nepotřebné.
vi.mock('../components/AkjBanner', () => ({ AkjBanner: () => null }));
vi.mock('@/shared/ui/RichTextEditor', () => ({
  RichTextEditor: () => null,
}));
// Subdoc taby — kromě DiaryTab stub na null (test je nepotřebuje).
vi.mock('../../CharacterDetailPage/components/FinanceTab', () => ({
  FinanceTab: () => null,
}));
vi.mock('../../CharacterDetailPage/components/InventoryTab', () => ({
  InventoryTab: () => null,
}));
vi.mock('../../CharacterDetailPage/components/NotesTab', () => ({
  NotesTab: () => null,
}));
vi.mock('../../CharacterDetailPage/components/CalendarTab', () => ({
  CalendarTab: () => null,
}));

// DiaryTab stub — věrně replikuje kontrakt: registruje saveAsync přes
// `onProvideSave`, umožní nastavit dirty a vystaví výsledek save (success/fail).
const saveSpy = vi.fn();
let nextSaveResult = true;
vi.mock('../../CharacterDetailPage/components/DiaryTab', () => ({
  DiaryTab: ({
    mode,
    onDirtyChange,
    onProvideSave,
  }: {
    mode: 'view' | 'edit';
    onDirtyChange: (d: boolean) => void;
    onProvideSave?: (fn: (() => Promise<boolean>) | null) => void;
  }) => {
    const saveAsync = useCallback(async () => {
      saveSpy();
      return nextSaveResult;
    }, []);
    useEffect(() => {
      onProvideSave?.(saveAsync);
      return () => onProvideSave?.(null);
    }, [onProvideSave, saveAsync]);
    return (
      <div>
        {`diary-${mode}`}
        <button type="button" onClick={() => onDirtyChange(true)}>
          make-dirty
        </button>
      </div>
    );
  },
}));

import { PostavaLayout } from './PostavaLayout';

const page = {
  id: 'p1',
  slug: 'hrdina',
  title: 'Hrdina',
  type: 'Postava hráče',
  ownerUserId: 'u1',
  characterRef: { characterId: 'c1' },
  akjTabs: [],
} as unknown as Page;

function renderLayout() {
  return render(<PostavaLayout page={page} />);
}

async function enterDiaryEdit() {
  // Přepni na tab Deník → zobrazí se hero tlačítko „Upravit záložku".
  fireEvent.click(screen.getByRole('tab', { name: /Deník/ }));
  fireEvent.click(await screen.findByRole('button', { name: 'Upravit záložku' }));
  // edit mód → tlačítko se přepne na „Hotovo".
  expect(await screen.findByText('diary-edit')).toBeInTheDocument();
}

beforeEach(() => {
  saveSpy.mockClear();
  nextSaveResult = true;
});

describe('PostavaLayout — horní „Hotovo" ukládá rozeditovaný tab', () => {
  it('dirty + Hotovo → zavolá registrovaný save a po úspěchu zavře edit', async () => {
    renderLayout();
    await enterDiaryEdit();
    fireEvent.click(screen.getByRole('button', { name: 'make-dirty' }));

    fireEvent.click(screen.getByRole('button', { name: 'Hotovo' }));

    await waitFor(() => expect(saveSpy).toHaveBeenCalledTimes(1));
    // Po úspěchu se vrátí view mode → tlačítko opět „Upravit záložku".
    expect(
      await screen.findByRole('button', { name: 'Upravit záložku' }),
    ).toBeInTheDocument();
    expect(screen.getByText('diary-view')).toBeInTheDocument();
    // Discard dialog se NESMÍ otevřít.
    expect(screen.queryByText('Zahodit změny')).not.toBeInTheDocument();
  });

  it('save selže (false) → zůstane v editu', async () => {
    nextSaveResult = false;
    renderLayout();
    await enterDiaryEdit();
    fireEvent.click(screen.getByRole('button', { name: 'make-dirty' }));

    fireEvent.click(screen.getByRole('button', { name: 'Hotovo' }));

    await waitFor(() => expect(saveSpy).toHaveBeenCalledTimes(1));
    // Save selhal → pořád edit (tlačítko „Hotovo", panel diary-edit).
    expect(
      await screen.findByRole('button', { name: 'Hotovo' }),
    ).toBeInTheDocument();
    expect(screen.getByText('diary-edit')).toBeInTheDocument();
  });

  it('není dirty + Hotovo → zavře edit bez volání save', async () => {
    renderLayout();
    await enterDiaryEdit();

    fireEvent.click(screen.getByRole('button', { name: 'Hotovo' }));

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Upravit záložku' }),
      ).toBeInTheDocument(),
    );
    expect(saveSpy).not.toHaveBeenCalled();
  });
});
