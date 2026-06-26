import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { getDefaultStore } from 'jotai';
import type { PropsWithChildren } from 'react';
import { AxiosError, type AxiosResponse } from 'axios';
import { RegisterModal } from './RegisterModal';
import {
  accessTokenAtom,
  refreshTokenAtom,
  currentUserAtom,
  loginModalOpenAtom,
  registerModalOpenAtom,
} from '@/shared/store/authStore';
import { api } from '@/shared/api/client';
import { UserRole } from '@/shared/types';

// SYNC factory (ne async importActual) — async mock se aplikuje pozdě a
// komponenta stihne naimportovat REÁLNÉ `api` → reálný axios → „Network Error"
// (postCalls=0, mock se míjí). `parseApiErrorCode` poskytujeme inline (jediný
// další import z client v grafu), ať nepotřebujeme `...actual`.
vi.mock('@/shared/api/client', () => ({
  api: { post: vi.fn(), get: vi.fn() },
  parseApiErrorCode: (error: unknown): string | null => {
    const data = (
      error as { response?: { data?: { error?: { code?: string } } } }
    )?.response?.data;
    return data?.error?.code ?? null;
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Availability check (debounced React Query) byl do RegisterModalu přidán
// později — bez mocku debounce+query churn zpozdrží submit výsledek za waitFor
// okno (+ prázdný stav indikátoru). Stub = vždy „available", deterministicky.
vi.mock('@/features/auth/api/useAvailability', () => ({
  useCheckUsername: () => ({ data: { available: true }, isFetching: false }),
  useCheckEmail: () => ({ data: { available: true }, isFetching: false }),
}));

// D-011 Turnstile mock — v jsdom Cloudflare widget nenačte, `onSuccess` by se
// nikdy nevolal → submit button zůstane disabled. Mock simuluje úspěšný captcha
// okamžitě po mountu (typescript-safe void render).
vi.mock('@marsidev/react-turnstile', () => ({
  Turnstile: ({ onSuccess }: { onSuccess?: (token: string) => void }) => {
    queueMicrotask(() => onSuccess?.('test-captcha-token'));
    return null;
  },
}));

function makeAxiosError(
  status: number,
  body?: Record<string, unknown>,
): AxiosError {
  const err = new AxiosError('mock');
  err.response = { status, data: body } as AxiosResponse;
  return err;
}

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

const store = getDefaultStore();

const successUser = {
  id: '1',
  email: 'newbie@test.io',
  username: 'newbie',
  role: UserRole.Ikarus,
  themeSettings: {},
  chatPreferences: {},
  favoriteDiscussionIds: [],
  isOnline: true,
  lastSeenAt: '',
  createdAt: '',
  updatedAt: '',
};

beforeEach(() => {
  store.set(accessTokenAtom, null);
  store.set(refreshTokenAtom, null);
  store.set(currentUserAtom, null);
  store.set(loginModalOpenAtom, false);
  store.set(registerModalOpenAtom, true);
  sessionStorage.clear();
  vi.clearAllMocks();
  // Default availability check stub — vždy "available"
  vi.mocked(api.get).mockResolvedValue({ available: true });
});

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('E-mail'), 'newbie@test.io');
  await user.type(screen.getByLabelText('Přezdívka'), 'newbie');
  await user.type(screen.getByLabelText('Heslo'), 'pass1234');
  await user.type(screen.getByLabelText('Potvrzení hesla'), 'pass1234');
  // D-010 — GDPR checkbox je povinný
  await user.click(screen.getByRole('checkbox'));
}

describe('RegisterModal — render + validation', () => {
  it('renderuje když registerModalOpenAtom je true', () => {
    render(<RegisterModal />, { wrapper: makeWrapper() });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Přezdívka')).toBeInTheDocument();
    expect(screen.getByLabelText('Heslo')).toBeInTheDocument();
    expect(screen.getByLabelText('Potvrzení hesla')).toBeInTheDocument();
  });

  it('autoFocus na email po otevření', async () => {
    render(<RegisterModal />, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByLabelText('E-mail'));
    });
  });

  it('zod validace: prázdný e-mail → chyba pod fieldem', async () => {
    const user = userEvent.setup();
    render(<RegisterModal />, { wrapper: makeWrapper() });
    await user.click(screen.getByRole('button', { name: 'Vytvořit účet' }));
    await waitFor(() => {
      expect(screen.getByText(/Zadej e-mail/i)).toBeInTheDocument();
    });
    expect(api.post).not.toHaveBeenCalled();
  });

  it('zod validace: hesla se neshodují → chyba pod passwordConfirm', async () => {
    const user = userEvent.setup();
    render(<RegisterModal />, { wrapper: makeWrapper() });
    await user.type(screen.getByLabelText('E-mail'), 'a@b.cc');
    await user.type(screen.getByLabelText('Přezdívka'), 'newbie');
    await user.type(screen.getByLabelText('Heslo'), 'pass1234');
    await user.type(screen.getByLabelText('Potvrzení hesla'), 'JINE12345');
    await user.click(screen.getByRole('button', { name: 'Vytvořit účet' }));
    await waitFor(() => {
      expect(screen.getByText(/neshod/i)).toBeInTheDocument();
    });
  });
});

describe('RegisterModal — submit + auto-login', () => {
  it('submit s validními údaji → atomy nastaveny + modal zavřen + toast', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      accessToken: 'a-1',
      refreshToken: 'r-1',
      user: successUser,
    });

    const user = userEvent.setup();
    render(<RegisterModal />, { wrapper: makeWrapper() });
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Vytvořit účet' }));

    await waitFor(() => {
      expect(store.get(accessTokenAtom)).toBe('a-1');
    });
    expect(store.get(refreshTokenAtom)).toBe('r-1');
    expect(store.get(currentUserAtom)).toEqual(successUser);
    expect(store.get(registerModalOpenAtom)).toBe(false);
    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      email: 'newbie@test.io',
      username: 'newbie',
      password: 'pass1234',
      acceptedTerms: true,
      captchaToken: 'test-captcha-token',
      hp: '',
    });
  });

  it('po úspěchu naviguje na intent z sessionStorage', async () => {
    sessionStorage.setItem('ikaros.loginIntent', '/ikaros/posta');
    vi.mocked(api.post).mockResolvedValueOnce({
      accessToken: 'a',
      refreshToken: 'r',
      user: successUser,
    });

    const user = userEvent.setup();
    render(<RegisterModal />, { wrapper: makeWrapper() });
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Vytvořit účet' }));

    await waitFor(() => {
      expect(sessionStorage.getItem('ikaros.loginIntent')).toBeNull();
    });
  });
});

describe('RegisterModal — error mapping', () => {
  it('409 EMAIL_TAKEN → field error pod e-mail (ne banner)', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(
      makeAxiosError(409, {
        error: { code: 'EMAIL_TAKEN', message: 'Email již existuje' },
      }),
    );
    const user = userEvent.setup();
    render(<RegisterModal />, { wrapper: makeWrapper() });
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Vytvořit účet' }));

    await waitFor(() => {
      expect(
        screen.getByText(/Tento e-mail už je registrovaný/i),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(store.get(registerModalOpenAtom)).toBe(true);
  });

  it('409 USERNAME_TAKEN → field error pod přezdívkou', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(
      makeAxiosError(409, {
        error: { code: 'USERNAME_TAKEN', message: 'Username již existuje' },
      }),
    );
    const user = userEvent.setup();
    render(<RegisterModal />, { wrapper: makeWrapper() });
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Vytvořit účet' }));

    await waitFor(() => {
      expect(
        screen.getByText(/Tato přezdívka už je obsazená/i),
      ).toBeInTheDocument();
    });
  });

  it('429 → banner', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(makeAxiosError(429));
    const user = userEvent.setup();
    render(<RegisterModal />, { wrapper: makeWrapper() });
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Vytvořit účet' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Příliš mnoho/i);
    });
  });

  it('5xx → banner "Něco se pokazilo"', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(makeAxiosError(500));
    const user = userEvent.setup();
    render(<RegisterModal />, { wrapper: makeWrapper() });
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Vytvořit účet' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/pokazilo/i);
    });
  });
});

describe('RegisterModal — UI interakce', () => {
  it('show/hide password toggle přepíná type pro obě pole hesel', async () => {
    const user = userEvent.setup();
    render(<RegisterModal />, { wrapper: makeWrapper() });

    const password = screen.getByLabelText('Heslo') as HTMLInputElement;
    const confirm = screen.getByLabelText('Potvrzení hesla') as HTMLInputElement;
    expect(password.type).toBe('password');
    expect(confirm.type).toBe('password');

    await user.click(screen.getByRole('button', { name: 'Zobrazit heslo' }));
    expect(password.type).toBe('text');
    expect(confirm.type).toBe('text');
  });

  it('cross-link "Přihlas se" otevře LoginModal a zavře RegisterModal', async () => {
    const user = userEvent.setup();
    render(<RegisterModal />, { wrapper: makeWrapper() });

    await user.click(screen.getByRole('button', { name: 'Přihlas se' }));

    expect(store.get(loginModalOpenAtom)).toBe(true);
    expect(store.get(registerModalOpenAtom)).toBe(false);
  });

  it('Escape zavře modal', async () => {
    const user = userEvent.setup();
    render(<RegisterModal />, { wrapper: makeWrapper() });
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(store.get(registerModalOpenAtom)).toBe(false);
    });
  });

  it('progressbar pro password strength se renderuje', async () => {
    const user = userEvent.setup();
    render(<RegisterModal />, { wrapper: makeWrapper() });

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '0');

    await user.type(screen.getByLabelText('Heslo'), 'Abcdef1234!@');
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toHaveAttribute(
        'aria-valuenow',
        '5',
      );
    });
    expect(screen.getByText(/Velmi silné/i)).toBeInTheDocument();
  });
});
