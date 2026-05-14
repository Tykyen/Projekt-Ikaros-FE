import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider, createStore } from 'jotai';
import type { PropsWithChildren } from 'react';
import { IkarosEventModal } from '../IkarosEventModal';
import { api, apiClient } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';
import type { IkarosEvent } from '@/shared/types';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiClient: { post: vi.fn() },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from 'sonner';

function renderModal(props: { event?: IkarosEvent; onClose?: () => void } = {}) {
  const onClose = props.onClose ?? vi.fn();
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const store = createStore();
  store.set(accessTokenAtom, 'token-x');
  const Wrapper = ({ children }: PropsWithChildren) => (
    <JotaiProvider store={store}>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </JotaiProvider>
  );
  const utils = render(
    <IkarosEventModal open onClose={onClose} event={props.event} />,
    { wrapper: Wrapper },
  );
  return { ...utils, onClose };
}

const baseEvent: IkarosEvent = {
  id: 'e1',
  title: 'Komunitní setkání',
  date: '2030-01-01T18:00:00Z',
  description: 'Původní popis',
  imageUrl: 'https://x/old.jpg',
  imageFocalX: 30,
  imageFocalY: 40,
  confirmable: true,
  confirmedCount: 0,
  confirmedBy: [],
  myRsvp: 'none',
  authorId: 'a',
  authorName: 'Admin',
  createdAtUtc: '2026-05-14T10:00:00Z',
  isActive: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('IkarosEventModal — create mode', () => {
  it('renderuje pole + tlačítka s create title', () => {
    renderModal();
    expect(screen.getByText('Nová akce')).toBeInTheDocument();
    expect(screen.getByLabelText(/Název akce/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Datum a čas/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Popis/)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Povolit potvrzení účasti/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zrušit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vytvořit' })).toBeInTheDocument();
  });

  it('prázdná povinná pole → submit zobrazí chyby a nezavolá API', async () => {
    renderModal();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Vytvořit' }));

    expect(
      await screen.findByText('Název akce je povinný'),
    ).toBeInTheDocument();
    expect(screen.getByText('Datum a čas jsou povinné')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('confirmable checkbox defaultně zaškrtnutý', () => {
    renderModal();
    const cb = screen.getByLabelText(
      /Povolit potvrzení účasti/,
    ) as HTMLInputElement;
    expect(cb.checked).toBe(true);
  });

  it('úspěšný submit → POST /ikaros-events + toast.success + onClose', async () => {
    vi.mocked(api.post).mockResolvedValue({
      ...baseEvent,
      id: 'eNew',
    });
    const onClose = vi.fn();
    renderModal({ onClose });
    const user = userEvent.setup();

    await user.type(
      screen.getByLabelText(/Název akce/),
      'Komunitní setkání',
    );
    await user.type(screen.getByLabelText(/Datum a čas/), '2026-06-01T18:00');
    await user.click(screen.getByRole('button', { name: 'Vytvořit' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/ikaros-events',
        expect.objectContaining({
          title: 'Komunitní setkání',
          date: '2026-06-01T18:00',
          confirmable: true,
        }),
      );
    });
    expect(toast.success).toHaveBeenCalledWith('Akce vytvořena.');
    expect(onClose).toHaveBeenCalled();
  });

  it('403 → toast.error a onClose', async () => {
    vi.mocked(api.post).mockRejectedValue({
      isAxiosError: true,
      response: { status: 403 },
    });
    const onClose = vi.fn();
    renderModal({ onClose });
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Název akce/), 'X');
    await user.type(screen.getByLabelText(/Datum a čas/), '2026-06-01T18:00');
    await user.click(screen.getByRole('button', { name: 'Vytvořit' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Nemáš oprávnění.');
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('image upload — soubor > 10 MB → chyba bez volání API', async () => {
    renderModal();
    const user = userEvent.setup();

    const bigFile = new File(['x'.repeat(11 * 1024 * 1024)], 'big.jpg', {
      type: 'image/jpeg',
    });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(fileInput, bigFile);

    await waitFor(() => {
      expect(
        screen.getByText('Obrázek je větší než 10 MB.'),
      ).toBeInTheDocument();
    });
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});

describe('IkarosEventModal — edit mode', () => {
  it('předvyplní pole z `event` propu + title je "Upravit akci"', () => {
    renderModal({ event: baseEvent });
    expect(screen.getByText('Upravit akci')).toBeInTheDocument();
    const titleInput = screen.getByLabelText(
      /Název akce/,
    ) as HTMLInputElement;
    expect(titleInput.value).toBe('Komunitní setkání');
    const descTextarea = screen.getByLabelText(/Popis/) as HTMLTextAreaElement;
    expect(descTextarea.value).toBe('Původní popis');
    expect(
      screen.getByRole('button', { name: 'Uložit změny' }),
    ).toBeInTheDocument();
    // image preview je zobrazený
    expect(
      document.querySelector('img[src="https://x/old.jpg"]'),
    ).not.toBeNull();
  });

  it('submit edit → PUT /ikaros-events/:id + toast "Akce upravena."', async () => {
    vi.mocked(api.put).mockResolvedValue({ ...baseEvent, title: 'Změněný' });
    const onClose = vi.fn();
    renderModal({ event: baseEvent, onClose });
    const user = userEvent.setup();

    const titleInput = screen.getByLabelText(
      /Název akce/,
    ) as HTMLInputElement;
    await user.clear(titleInput);
    await user.type(titleInput, 'Změněný');
    await user.click(screen.getByRole('button', { name: 'Uložit změny' }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        '/ikaros-events/e1',
        expect.objectContaining({
          title: 'Změněný',
          imageUrl: 'https://x/old.jpg',
        }),
      );
    });
    expect(toast.success).toHaveBeenCalledWith('Akce upravena.');
    expect(onClose).toHaveBeenCalled();
  });

  it('odebrání obrázku → PUT pošle imageUrl: null', async () => {
    vi.mocked(api.put).mockResolvedValue(baseEvent);
    renderModal({ event: baseEvent });
    const user = userEvent.setup();

    await user.click(
      screen.getByRole('button', { name: 'Odstranit obrázek' }),
    );
    await user.click(screen.getByRole('button', { name: 'Uložit změny' }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        '/ikaros-events/e1',
        expect.objectContaining({
          imageUrl: null,
        }),
      );
    });
  });
});
