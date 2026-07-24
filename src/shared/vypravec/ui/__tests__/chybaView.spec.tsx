/**
 * Spec 25.1 — formulář „Nahlásit chybu" ve Vypravěči. Ověřuje: persona hlášku
 * dle plochy (Ishida/Joe), odeslání s auto-kontextem, potvrzení tónem postavy.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { getDefaultStore } from 'jotai';
import { currentUserAtom } from '@/shared/store/authStore';
import type { VypravecWorldInfo } from '../../engine/resolveHeader';
import { VypravecRoot } from '../VypravecRoot';

vi.mock('@/shared/api', () => ({
  api: { get: vi.fn(), patch: vi.fn(), post: vi.fn() },
}));
import { api } from '@/shared/api';

const jotai = getDefaultStore();

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  jotai.set(currentUserAtom, null); // anon — bez persona dialogu, ale formulář jede
  vi.mocked(api.get).mockResolvedValue({ state: null, legacy: false });
  vi.mocked(api.patch).mockResolvedValue({});
  vi.mocked(api.post).mockResolvedValue({ id: 'bug1' });
});

function otevriChybu() {
  act(() => {
    window.dispatchEvent(new Event('vypravec:nahlasit-chybu'));
  });
}

describe('ChybaView (25.1)', () => {
  it('platforma → Ishida; odeslání pošle kontext + potvrzení', async () => {
    render(
      <MemoryRouter initialEntries={['/ikaros']}>
        <VypravecRoot scope="ikaros" />
      </MemoryRouter>,
    );
    const user = userEvent.setup();
    otevriChybu();

    await waitFor(() =>
      expect(screen.getByText(/Něco skřípe/)).toBeInTheDocument(),
    );

    const ta = screen.getByLabelText('Popis chyby');
    await user.type(ta, 'Tlačítko nic nedělá');
    expect(ta).toHaveValue('Tlačítko nic nedělá');

    const btn = screen.getByRole('button', { name: /Odeslat hlášení/ });
    expect(btn).toBeEnabled();
    await user.click(btn);

    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    expect(api.post).toHaveBeenCalledWith(
      '/bug-reports',
      expect.objectContaining({
        text: 'Tlačítko nic nedělá',
        context: expect.objectContaining({
          speaker: 'ikaros',
          scope: 'ikaros',
          userAgent: expect.any(String),
        }),
      }),
    );
    // potvrzení Ishidovým tónem
    await waitFor(() => expect(screen.getByText(/Mám to/)).toBeInTheDocument());
  });

  it('svět → Joe (ženský rod v úvodu)', async () => {
    const world = {
      worldId: 'w1',
      worldSlug: 'muj-svet',
      name: 'Můj svět',
      isPJ: false,
      isOwner: false,
    } as VypravecWorldInfo;
    render(
      <MemoryRouter initialEntries={['/svet/muj-svet']}>
        <VypravecRoot scope="world" world={world} />
      </MemoryRouter>,
    );
    otevriChybu();

    await waitFor(() =>
      expect(screen.getByText(/předám to dál/)).toBeInTheDocument(),
    );
  });
});
