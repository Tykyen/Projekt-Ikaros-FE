import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { MemoryRouter } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { WelcomeSection } from '../WelcomeSection';
import {
  accessTokenAtom,
  registerModalOpenAtom,
} from '@/shared/store/authStore';

// Spec 15.7 — anon vidí CTA tlačítka, přihlášený ne.
// isAuthenticatedAtom = accessTokenAtom !== null → token nastavíme pro „přihlášen".

function renderWith(authed: boolean) {
  const store = createStore();
  if (authed) store.set(accessTokenAtom, 'jwt-token');
  const Wrapper = ({ children }: PropsWithChildren) => (
    <MemoryRouter>
      <JotaiProvider store={store}>{children}</JotaiProvider>
    </MemoryRouter>
  );
  return { store, ...render(<WelcomeSection />, { wrapper: Wrapper }) };
}

beforeEach(() => {
  // accessTokenAtom je atomWithStorage → vyčistit, ať „přihlášen" neleakuje.
  localStorage.clear();
});

describe('WelcomeSection — anon CTA (15.7)', () => {
  it('anon vidí obě CTA tlačítka', () => {
    renderWith(false);
    expect(
      screen.getByRole('button', { name: /Vytvořit svět zdarma/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Prozkoumat světy/i }),
    ).toBeInTheDocument();
  });

  it('přihlášený CTA tlačítka nevidí', () => {
    renderWith(true);
    expect(
      screen.queryByRole('button', { name: /Vytvořit svět zdarma/i }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: /Prozkoumat světy/i }),
    ).toBeNull();
  });

  it('klik na „Vytvořit svět zdarma" otevře registraci', () => {
    const { store } = renderWith(false);
    fireEvent.click(
      screen.getByRole('button', { name: /Vytvořit svět zdarma/i }),
    );
    expect(store.get(registerModalOpenAtom)).toBe(true);
  });
});
