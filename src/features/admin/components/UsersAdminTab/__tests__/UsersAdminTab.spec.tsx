import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UsersAdminTab } from '../UsersAdminTab';

// Tabulka + modal jsou mock — testujeme jen prefill hledání z URL.
vi.mock('../../../users/components/UsersTab/UsersTable', () => ({
  UsersTable: () => <div>TABLE</div>,
}));
vi.mock('../../../users/components/UsersTab/CreateUserModal', () => ({
  CreateUserModal: () => null,
}));

const useAdminUsersMock = vi.fn((_query: unknown) => ({
  data: undefined,
  isLoading: false,
}));
vi.mock('../../../users/api/useAdminUsers', () => ({
  useAdminUsers: (query: unknown) => useAdminUsersMock(query),
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <UsersAdminTab />
    </MemoryRouter>,
  );
}

describe('UsersAdminTab — prefill hledání z URL (?search=)', () => {
  it('?search= předvyplní input i dotaz (deep-link z profilu)', () => {
    renderAt('/admin?tab=uzivatele&search=FOksiGen');
    const input = screen.getByLabelText<HTMLInputElement>(
      'Hledat podle username',
    );
    expect(input.value).toBe('FOksiGen');
    expect(useAdminUsersMock).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'FOksiGen' }),
    );
  });

  it('bez ?search= je hledání prázdné', () => {
    renderAt('/admin?tab=uzivatele');
    const input = screen.getByLabelText<HTMLInputElement>(
      'Hledat podle username',
    );
    expect(input.value).toBe('');
    expect(useAdminUsersMock).toHaveBeenCalledWith(
      expect.objectContaining({ username: undefined }),
    );
  });
});
