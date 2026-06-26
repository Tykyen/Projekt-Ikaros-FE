import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiaryTab } from '../components/DiaryTab';
import type { CharacterDiary } from '../../api/characters.types';

let mockDiary: CharacterDiary | undefined;
let mockState = { isLoading: false, isError: false };
const mutate = vi.fn();

vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({ worldId: 'w1' }),
}));
// 16.2c — DiaryTab volá useDiarySkin (→ useWorldStatus = React Query). Stub,
// ať test nepotřebuje QueryClientProvider (jinak „No QueryClient").
vi.mock('../diary-systems/skins/useDiarySkin', () => ({
  useDiarySkin: () => ({ skin: 'fantasy', setSkin: vi.fn(), isPending: false }),
}));
vi.mock('../../api/useCharacterSubdocs', () => ({
  useCharacterDiary: () => ({
    data: mockDiary,
    isLoading: mockState.isLoading,
    isError: mockState.isError,
  }),
}));
vi.mock('../../api/useCharacterMutations', () => ({
  useUpdateCharacterDiary: () => ({ mutate, isPending: false }),
}));
// 8.5 — DiaryTab teď používá fallback hook + override mutace. Pro existující
// 8.1b testy stačí stub bez QueryClient.
vi.mock('../../WorldDiarySchemaEditorPage/api/useDiarySchema', () => ({
  useActiveDiarySchema: () => ({
    data: undefined,
    activeMeta: undefined,
    isLoading: false,
    isError: false,
  }),
  useUpdatePersonalDiarySchema: () => ({ mutate: vi.fn(), isPending: false }),
  useResetPersonalDiarySchema: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/shared/ui/RichTextEditor', () => ({
  RichTextEditor: ({ value }: { value: string }) => <div>{value}</div>,
}));
// D-DIARY-3 — SchemaValueEditor používá useUploadImage hook (image typ).
vi.mock('@/shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api')>();
  return {
    ...actual,
    useUploadImage: () => ({
      mutateAsync: vi.fn().mockResolvedValue({ url: '' }),
      isPending: false,
    }),
  };
});

const noop = () => {};

function setup(diary: CharacterDiary | undefined) {
  mockDiary = diary;
  mockState = { isLoading: false, isError: false };
  return render(
    <DiaryTab
      slug="aragorn"
      mode="view"
      onExitEdit={noop}
      onDirtyChange={noop}
    />,
  );
}

describe('DiaryTab (8.1b)', () => {
  it('prázdný deník → hláška', () => {
    setup({
      id: 'd1',
      characterId: 'c1',
      worldId: 'w1',
      sections: [],
      customData: {},
    });
    expect(screen.getByText('Deník je zatím prázdný.')).toBeInTheDocument();
  });

  it('vykreslí sekci zápisku', () => {
    setup({
      id: 'd1',
      characterId: 'c1',
      worldId: 'w1',
      sections: [
        {
          id: 's1',
          title: 'Den první',
          content: 'Vyrazili jsme.',
          order: 0,
          isCollapsed: false,
          items: [],
        },
      ],
      customData: {},
    });
    expect(screen.getByText('Den první')).toBeInTheDocument();
    expect(screen.getByText('Vyrazili jsme.')).toBeInTheDocument();
  });

  it('vykreslí dynamický blok typu bar s hodnotou/maximem', () => {
    setup({
      id: 'd1',
      characterId: 'c1',
      worldId: 'w1',
      sections: [],
      personalDiarySchema: [
        {
          id: 'hp',
          type: 'bar',
          label: 'Životy',
          maxValue: 100,
          order: 0,
        },
      ],
      customData: { hp: 73 },
    });
    expect(screen.getByText('Životy')).toBeInTheDocument();
    expect(screen.getByText('73 / 100')).toBeInTheDocument();
  });

  it('error stav → hláška o selhání', () => {
    mockDiary = undefined;
    mockState = { isLoading: false, isError: true };
    render(
      <DiaryTab
        slug="aragorn"
        mode="view"
        onExitEdit={noop}
        onDirtyChange={noop}
      />,
    );
    expect(
      screen.getByText('Deník se nepodařilo načíst.'),
    ).toBeInTheDocument();
  });
});

describe('DiaryTab (8.1b) — edit', () => {
  beforeEach(() => {
    mockState = { isLoading: false, isError: false };
    mutate.mockClear();
    mockDiary = {
      id: 'd1',
      characterId: 'c1',
      worldId: 'w1',
      sections: [
        {
          id: 's1',
          title: 'Den první',
          content: '',
          order: 0,
          isCollapsed: false,
          items: [],
        },
      ],
      personalDiarySchema: [
        { id: 'hp', type: 'bar', label: 'Životy', maxValue: 100, order: 0 },
      ],
      customData: { hp: 73 },
    };
  });

  function renderEdit(onExitEdit = noop, onDirtyChange = noop) {
    return render(
      <DiaryTab
        slug="aragorn"
        mode="edit"
        onExitEdit={onExitEdit}
        onDirtyChange={onDirtyChange}
      />,
    );
  }

  it('zobrazí banner, editor sekcí a atribut bloku', () => {
    renderEdit();
    expect(screen.getByText(/Režim úprav/)).toBeInTheDocument();
    expect(screen.getByText('Přidat sekci')).toBeInTheDocument();
    expect(screen.getByLabelText(/Životy/)).toHaveValue(73);
  });

  it('změna hodnoty bloku nahlásí dirty', () => {
    const onDirtyChange = vi.fn();
    renderEdit(noop, onDirtyChange);
    fireEvent.change(screen.getByLabelText(/Životy/), {
      target: { value: '50' },
    });
    expect(onDirtyChange).toHaveBeenCalledWith(true);
  });

  it('uložení volá mutaci se sekcemi a customDataPatch (D-040-followup delta)', () => {
    renderEdit();
    fireEvent.change(screen.getByLabelText(/Životy/), {
      target: { value: '50' },
    });
    fireEvent.click(screen.getByText('Uložit změny'));
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        // Delta merge: pošleme jen změněný key (hp), ne celý customData.
        customDataPatch: expect.objectContaining({ hp: 50 }),
        sections: expect.any(Array),
      }),
      expect.anything(),
    );
  });

  it('Zrušit volá onExitEdit', () => {
    const onExitEdit = vi.fn();
    renderEdit(onExitEdit);
    fireEvent.click(screen.getByText('Zrušit'));
    expect(onExitEdit).toHaveBeenCalledOnce();
  });
});
