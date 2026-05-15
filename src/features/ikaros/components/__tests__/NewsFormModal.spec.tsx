import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { NewsFormModal } from '../NewsFormModal';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from 'sonner';

interface RenderOpts {
  mode?: 'create' | 'edit';
  initialData?: { id: string; title: string; content: string };
  onClose?: ReturnType<typeof vi.fn>;
}

function renderModal({
  mode = 'create',
  initialData,
  onClose = vi.fn(),
}: RenderOpts = {}) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  const utils = render(
    <NewsFormModal
      open
      mode={mode}
      initialData={initialData}
      onClose={onClose}
    />,
    { wrapper: Wrapper },
  );
  return { ...utils, onClose };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('NewsFormModal — create mode (BC s 3.1a)', () => {
  it('renderuje pole Nadpis, Obsah a tlačítka Zrušit / Vytvořit', () => {
    renderModal();
    expect(screen.getByLabelText('Nadpis')).toBeInTheDocument();
    expect(screen.getByLabelText('Obsah')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zrušit' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Vytvořit' }),
    ).toBeInTheDocument();
  });

  it('title modalu je "Nová novinka" v create módu', () => {
    renderModal();
    expect(screen.getByText('Nová novinka')).toBeInTheDocument();
  });

  it('prázdná pole → submit zobrazí chyby a nezavolá API', async () => {
    renderModal();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Vytvořit' }));

    expect(await screen.findByText('Nadpis je povinný')).toBeInTheDocument();
    expect(screen.getByText('Obsah je povinný')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('úspěšný submit → POST /IkarosNews + toast.success + onClose', async () => {
    vi.mocked(api.post).mockResolvedValue({
      id: 'n2',
      title: 'T',
      content: 'C',
      authorId: 'a',
      authorName: 'A',
      createdAtUtc: '',
      isActive: true,
      archived: false,
    });
    const onClose = vi.fn();
    renderModal({ onClose });
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Nadpis'), 'Můj nadpis');
    await user.type(screen.getByLabelText('Obsah'), 'Obsah novinky');
    await user.click(screen.getByRole('button', { name: 'Vytvořit' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/IkarosNews', {
        title: 'Můj nadpis',
        content: 'Obsah novinky',
      });
    });
    expect(toast.success).toHaveBeenCalledWith('Novinka vytvořena.');
    expect(onClose).toHaveBeenCalled();
  });

  it('403 → toast.error "Nemáš oprávnění." + onClose', async () => {
    vi.mocked(api.post).mockRejectedValue({
      isAxiosError: true,
      response: { status: 403 },
    });
    const onClose = vi.fn();
    renderModal({ onClose });
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Nadpis'), 'X');
    await user.type(screen.getByLabelText('Obsah'), 'Y');
    await user.click(screen.getByRole('button', { name: 'Vytvořit' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Nemáš oprávnění.');
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('jiná chyba → toast.error a modal zůstane (onClose nezavolán)', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('network'));
    const onClose = vi.fn();
    renderModal({ onClose });
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Nadpis'), 'X');
    await user.type(screen.getByLabelText('Obsah'), 'Y');
    await user.click(screen.getByRole('button', { name: 'Vytvořit' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Nepodařilo se vytvořit novinku.',
      );
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('NewsFormModal — edit mode (Spec 3.1)', () => {
  const initialData = {
    id: 'news-42',
    title: 'Starý nadpis',
    content: 'Starý obsah',
  };

  it('title modalu je "Upravit novinku", primary button "Uložit"', () => {
    renderModal({ mode: 'edit', initialData });
    expect(screen.getByText('Upravit novinku')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Uložit' })).toBeInTheDocument();
  });

  it('pole předvyplněná z initialData', () => {
    renderModal({ mode: 'edit', initialData });
    expect(screen.getByLabelText('Nadpis')).toHaveValue('Starý nadpis');
    expect(screen.getByLabelText('Obsah')).toHaveValue('Starý obsah');
  });

  it('úspěšný submit → PATCH /IkarosNews/:id + toast "Novinka uložena."', async () => {
    vi.mocked(api.patch).mockResolvedValue({
      ...initialData,
      authorId: 'a',
      authorName: 'A',
      createdAtUtc: '',
      isActive: true,
      archived: false,
    });
    const onClose = vi.fn();
    renderModal({ mode: 'edit', initialData, onClose });
    const user = userEvent.setup();

    await user.clear(screen.getByLabelText('Nadpis'));
    await user.type(screen.getByLabelText('Nadpis'), 'Nový nadpis');
    await user.click(screen.getByRole('button', { name: 'Uložit' }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/IkarosNews/news-42', {
        title: 'Nový nadpis',
        content: 'Starý obsah',
      });
    });
    expect(toast.success).toHaveBeenCalledWith('Novinka uložena.');
    expect(onClose).toHaveBeenCalled();
  });

  it('404 → toast.error "Novinka nenalezena." + onClose', async () => {
    vi.mocked(api.patch).mockRejectedValue({
      isAxiosError: true,
      response: { status: 404 },
    });
    const onClose = vi.fn();
    renderModal({ mode: 'edit', initialData, onClose });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Uložit' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Novinka nenalezena.');
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('síťová chyba → toast.error "Nepodařilo se uložit novinku." + modal zůstane', async () => {
    vi.mocked(api.patch).mockRejectedValue(new Error('network'));
    const onClose = vi.fn();
    renderModal({ mode: 'edit', initialData, onClose });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Uložit' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Nepodařilo se uložit novinku.',
      );
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
