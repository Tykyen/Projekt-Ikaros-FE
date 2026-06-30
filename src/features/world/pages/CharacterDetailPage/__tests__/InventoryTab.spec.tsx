import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { InventoryTab } from '../components/InventoryTab';
import type { CharacterInventory } from '../../api/characters.types';
import type { Page } from '../../api/pages.types';

let mockData: CharacterInventory | undefined;
let mockState = { isLoading: false, isError: false, error: undefined as unknown };
const mutate = vi.fn();
const refetchFn = vi.fn();

vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({ worldId: 'w1' }),
}));
vi.mock('../../api/useCharacterSubdocs', () => ({
  useCharacterInventory: () => ({
    data: mockData,
    isLoading: mockState.isLoading,
    isError: mockState.isError,
    error: mockState.error,
    refetch: refetchFn,
  }),
}));
vi.mock('../../api/useCharacterMutations', () => ({
  useUpdateCharacterInventory: () => ({ mutate, isPending: false }),
}));
vi.mock('@/shared/ui/RichTextEditor', () => ({
  RichTextEditor: ({ value }: { value?: string }) => <div>{value}</div>,
}));

const PAGE: Page = {
  id: 'p1',
  slug: 'aragorn',
  worldId: 'w1',
  title: 'Aragorn',
  type: 'Postava hráče',
  category: 'Postavy',
  content: '',
  publicInfoBlocks: [],
  imageUrl: '',
  accessRequirements: [],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const INVENTORY: CharacterInventory = {
  id: 'i1',
  characterId: 'c1',
  isHidden: false,
  sections: [
    {
      id: 's1',
      title: 'Zbraně',
      content: '',
      order: 0,
      isCollapsed: false,
      items: [
        { id: 'it1', text: 'Meč', quantity: 1 },
        { id: 'it2', text: 'Dýka', quantity: 3 },
      ],
    },
  ],
  notes: '',
};

const noop = () => {};

describe('InventoryTab (8.1d + 8.1-FIR)', () => {
  beforeEach(() => {
    mockData = INVENTORY;
    mockState = { isLoading: false, isError: false, error: undefined };
    mutate.mockClear();
    refetchFn.mockClear();
  });

  it('view — sekce se zobrazí (default collapsed), klikem se rozbalí', () => {
    render(
      <InventoryTab
        page={PAGE}
        mode="view"
        onExitEdit={noop}
        onDirtyChange={noop}
        canEdit
      />,
    );
    // Sekce je collapsed default — vidím název, ne items.
    expect(screen.getByText('Zbraně')).toBeInTheDocument();
    expect(screen.queryByText('Meč')).not.toBeInTheDocument();
    // Klik rozbalí.
    fireEvent.click(screen.getByText('Zbraně'));
    expect(screen.getByText('Meč')).toBeInTheDocument();
    expect(screen.getByText('Dýka')).toBeInTheDocument();
  });

  it('view — počet položek (sum quantity) v hlavičce sekce', () => {
    render(
      <InventoryTab
        page={PAGE}
        mode="view"
        onExitEdit={noop}
        onDirtyChange={noop}
        canEdit
      />,
    );
    expect(screen.getByText('4 položek')).toBeInTheDocument();
  });

  it('view — qty stepper viditelný jen pro canEdit', () => {
    const { rerender } = render(
      <InventoryTab
        page={PAGE}
        mode="view"
        onExitEdit={noop}
        onDirtyChange={noop}
        canEdit
      />,
    );
    fireEvent.click(screen.getByText('Zbraně'));
    expect(screen.getAllByLabelText('Přidat').length).toBeGreaterThan(0);

    rerender(
      <InventoryTab
        page={PAGE}
        mode="view"
        onExitEdit={noop}
        onDirtyChange={noop}
        canEdit={false}
      />,
    );
    expect(screen.queryByLabelText('Přidat')).not.toBeInTheDocument();
    expect(screen.getByText('×3')).toBeInTheDocument();
  });

  it('view — qty +1 stepper volá mutation optimistic', () => {
    render(
      <InventoryTab
        page={PAGE}
        mode="view"
        onExitEdit={noop}
        onDirtyChange={noop}
        canEdit
      />,
    );
    fireEvent.click(screen.getByText('Zbraně'));
    const addBtns = screen.getAllByLabelText('Přidat');
    fireEvent.click(addBtns[0]); // +1 pro „Meč" (qty 1 → 2)
    expect(mutate).toHaveBeenCalled();
  });

  it('view — aside obsahuje stats sekcí a položek', () => {
    render(
      <InventoryTab
        page={PAGE}
        mode="view"
        onExitEdit={noop}
        onDirtyChange={noop}
        canEdit
      />,
    );
    expect(screen.getByText('Osobní výbava')).toBeInTheDocument();
    // 1 sekce, 4 položky (1 Meč + 3 Dýky)
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('view — prázdná výbava + prázdné notes → hláška', () => {
    mockData = { ...INVENTORY, sections: [], notes: '' };
    render(
      <InventoryTab
        page={PAGE}
        mode="view"
        onExitEdit={noop}
        onDirtyChange={noop}
        canEdit
      />,
    );
    expect(screen.getByText('Výbava je prázdná.')).toBeInTheDocument();
  });

  it('view — error stav → SubdocErrorState s retry', () => {
    mockData = undefined;
    mockState = {
      isLoading: false,
      isError: true,
      error: new Error('boom'),
    };
    render(
      <InventoryTab
        page={PAGE}
        mode="view"
        onExitEdit={noop}
        onDirtyChange={noop}
        canEdit
      />,
    );
    expect(screen.getByText('Načtení se nepodařilo.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Zkusit znovu'));
    expect(refetchFn).toHaveBeenCalled();
  });

  it('edit — banner a editor sekcí', () => {
    render(
      <InventoryTab
        page={PAGE}
        mode="edit"
        onExitEdit={noop}
        onDirtyChange={noop}
        canEdit
      />,
    );
    expect(screen.getByText(/Režim úprav/)).toBeInTheDocument();
    expect(screen.getByText('Přidat sekci')).toBeInTheDocument();
  });

  it('edit — uložení volá mutaci s sections + notes', () => {
    render(
      <InventoryTab
        page={PAGE}
        mode="edit"
        onExitEdit={noop}
        onDirtyChange={noop}
        canEdit
      />,
    );
    fireEvent.change(screen.getByDisplayValue('Zbraně'), {
      target: { value: 'Vybavení' },
    });
    fireEvent.click(screen.getByText('Uložit změny'));
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        sections: expect.arrayContaining([
          expect.objectContaining({ title: 'Vybavení' }),
        ]),
        notes: '',
      }),
      expect.anything(),
    );
  });

  it('edit — Zrušit volá onExitEdit', () => {
    const onExitEdit = vi.fn();
    render(
      <InventoryTab
        page={PAGE}
        mode="edit"
        onExitEdit={onExitEdit}
        onDirtyChange={noop}
        canEdit
      />,
    );
    fireEvent.click(screen.getByText('Zrušit'));
    expect(onExitEdit).toHaveBeenCalledOnce();
  });

  // Bug fix (testeři) — horní „Hotovo" v hlavičce PostavaLayoutu musí
  // rozeditovaný tab ULOŽIT. Tab proto registruje async save přes
  // `onProvideSave`; jeho zavolání spustí mutaci s aktuálními daty.
  it('edit — registruje onProvideSave; zavolání uloží aktuální data + vrátí true', async () => {
    let registered: (() => Promise<boolean>) | null = null;
    render(
      <InventoryTab
        page={PAGE}
        mode="edit"
        onExitEdit={noop}
        onDirtyChange={noop}
        canEdit
        onProvideSave={(fn) => {
          registered = fn;
        }}
      />,
    );
    expect(registered).toBeTypeOf('function');

    // Změna → aktuální stav (žádná stale closure).
    fireEvent.change(screen.getByDisplayValue('Zbraně'), {
      target: { value: 'Vybavení' },
    });

    mutate.mockImplementation((_input, opts) => opts.onSuccess?.());
    let result: boolean | undefined;
    await act(async () => {
      result = await registered!();
    });

    expect(result).toBe(true);
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        sections: expect.arrayContaining([
          expect.objectContaining({ title: 'Vybavení' }),
        ]),
      }),
      expect.anything(),
    );
  });

  it('edit — chyba mutace → onProvideSave save vrátí false', async () => {
    let registered: (() => Promise<boolean>) | null = null;
    render(
      <InventoryTab
        page={PAGE}
        mode="edit"
        onExitEdit={noop}
        onDirtyChange={noop}
        canEdit
        onProvideSave={(fn) => {
          registered = fn;
        }}
      />,
    );
    mutate.mockImplementation((_input, opts) => opts.onError?.(new Error('x')));
    let result: boolean | undefined;
    await act(async () => {
      result = await registered!();
    });
    expect(result).toBe(false);
  });
});
