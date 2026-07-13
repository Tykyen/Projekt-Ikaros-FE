/**
 * D-DROBNE-UNDO — testy „Zpět" tlačítka:
 *   1. klik volá undo endpoint (postMapUndo se sceneId)
 *   2. NOTHING_TO_UNDO → nenápadný info toast (ne error)
 *   3. jiná chyba → error toast
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MapUndoButton } from './MapUndoButton';

const { postUndo, toastInfo, toastError } = vi.hoisted(() => ({
  postUndo: vi.fn<(sceneId: string) => Promise<unknown>>(() =>
    Promise.resolve({ recordId: 'r1', seqNumber: 2 }),
  ),
  toastInfo: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('../api/mapApi', () => ({ postMapUndo: postUndo }));
vi.mock('sonner', () => ({
  toast: { info: toastInfo, error: toastError },
}));
vi.mock('@/shared/api', () => ({
  parseApiError: () => 'server říká ne',
  parseApiErrorCode: (e: unknown) =>
    (e as { code?: string } | null)?.code ?? null,
}));

function renderButton() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={qc}>
      <MapUndoButton sceneId="scene1" worldId="world1" />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  postUndo.mockClear();
  toastInfo.mockClear();
  toastError.mockClear();
  postUndo.mockImplementation(() =>
    Promise.resolve({ recordId: 'r1', seqNumber: 2 }),
  );
});

describe('MapUndoButton', () => {
  it('klik volá POST /maps/:id/operations/undo se sceneId', async () => {
    renderButton();
    fireEvent.click(screen.getByRole('button', { name: 'Vrátit poslední akci' }));
    await waitFor(() => expect(postUndo).toHaveBeenCalledWith('scene1'));
    expect(toastError).not.toHaveBeenCalled();
    expect(toastInfo).not.toHaveBeenCalled();
  });

  it('NOTHING_TO_UNDO → nenápadný toast „Není co vrátit" (ne error)', async () => {
    postUndo.mockImplementation(() =>
      Promise.reject({ code: 'NOTHING_TO_UNDO' }),
    );
    renderButton();
    fireEvent.click(screen.getByRole('button', { name: 'Vrátit poslední akci' }));
    await waitFor(() =>
      expect(toastInfo).toHaveBeenCalledWith('Není co vrátit'),
    );
    expect(toastError).not.toHaveBeenCalled();
  });

  it('jiná chyba → error toast s parseApiError textem', async () => {
    postUndo.mockImplementation(() =>
      Promise.reject({ code: 'MAP_OP_FORBIDDEN' }),
    );
    renderButton();
    fireEvent.click(screen.getByRole('button', { name: 'Vrátit poslední akci' }));
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        'Vrácení akce selhalo: server říká ne',
      ),
    );
    expect(toastInfo).not.toHaveBeenCalled();
  });
});
