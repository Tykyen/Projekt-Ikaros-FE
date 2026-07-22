/**
 * Spec 26.6 — regrese persona dialogu (26.4): login PO mountu (modal login
 * layout neremountuje!) → init → GET {state:null, legacy:false} → auto-open
 * panelu s Ishidovým uvítáním; volba PJ startuje cestu.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { getDefaultStore } from 'jotai';
import { currentUserAtom } from '@/shared/store/authStore';
import type { User } from '@/shared/types';
import { onboardingStore } from '../../state/onboardingStore';
import { VypravecRoot } from '../VypravecRoot';

vi.mock('@/shared/api', () => ({ api: { get: vi.fn(), patch: vi.fn() } }));
import { api } from '@/shared/api';

const jotai = getDefaultStore();

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  jotai.set(currentUserAtom, null);
  vi.mocked(api.patch).mockResolvedValue({});
  vi.mocked(api.get).mockResolvedValue({ state: null, legacy: false });
  // reset interního stavu store (jiná identita → čistý kontext)
  void onboardingStore.getSnapshot();
});

describe('persona dialog (26.4)', () => {
  it('login po mountu → auto-open panelu s uvítáním; volba PJ startuje cestu', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <VypravecRoot scope="ikaros" />
      </MemoryRouter>,
    );
    // před loginem nic
    expect(screen.queryByText(/Jsem Ishida/)).toBeNull();

    // login (modal — bez remountu)
    jotai.set(currentUserAtom, { id: `pd-${Math.random()}` } as unknown as User);

    await waitFor(
      () => expect(screen.getByText(/Jsem Ishida/)).toBeInTheDocument(),
      { timeout: 5000 },
    );

    await userEvent.click(screen.getByRole('button', { name: /Chci vést hru/ }));
    // panel zavřený, lišta kroku 1 viditelná
    await waitFor(() =>
      expect(screen.getByText(/Založ svět/)).toBeInTheDocument(),
    );
  });
});
