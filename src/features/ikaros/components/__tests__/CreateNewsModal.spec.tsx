import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { CreateNewsModal } from '../CreateNewsModal';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from 'sonner';

function renderModal(onClose = vi.fn()) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  const utils = render(<CreateNewsModal open onClose={onClose} />, {
    wrapper: Wrapper,
  });
  return { ...utils, onClose };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CreateNewsModal', () => {
  it('renderuje pole Nadpis, Obsah a tlačítka', () => {
    renderModal();
    expect(screen.getByLabelText('Nadpis')).toBeInTheDocument();
    expect(screen.getByLabelText('Obsah')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zrušit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vytvořit' })).toBeInTheDocument();
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
    });
    const onClose = vi.fn();
    renderModal(onClose);
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
    expect(toast.success).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('403 → toast.error + onClose', async () => {
    vi.mocked(api.post).mockRejectedValue({
      isAxiosError: true,
      response: { status: 403 },
    });
    const onClose = vi.fn();
    renderModal(onClose);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Nadpis'), 'X');
    await user.type(screen.getByLabelText('Obsah'), 'Y');
    await user.click(screen.getByRole('button', { name: 'Vytvořit' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Nemáš oprávnění vytvořit novinku.',
      );
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('jiná chyba → toast.error a modal zůstane (onClose nezavolán)', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('network'));
    const onClose = vi.fn();
    renderModal(onClose);
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
