import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { RecipientPicker } from './RecipientPicker';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({ api: { get: vi.fn() } }));

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const W = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return render(<W>{ui}</W>);
}

describe('RecipientPicker', () => {
  beforeEach(() => vi.clearAllMocks());

  it('vyhledá uživatele po napsání ≥2 znaků a umožní výběr', async () => {
    vi.mocked(api.get).mockResolvedValue([{ id: 'u1', username: 'Alice' }]);
    const onChange = vi.fn();
    const user = userEvent.setup();
    wrap(<RecipientPicker value={null} onChange={onChange} />);

    await user.type(screen.getByPlaceholderText(/Hledat uživatele/i), 'al');

    const option = await screen.findByRole('button', { name: 'Alice' });
    await user.click(option);
    expect(onChange).toHaveBeenCalledWith({ id: 'u1', username: 'Alice' });
  });

  it('s vybranou hodnotou zobrazí jméno a tlačítko změny', () => {
    const onChange = vi.fn();
    wrap(
      <RecipientPicker
        value={{ id: 'u1', username: 'Alice' }}
        onChange={onChange}
      />,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    screen.getByLabelText('Změnit příjemce').click();
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('odfiltruje vlastní účet z výsledků (excludeId)', async () => {
    vi.mocked(api.get).mockResolvedValue([
      { id: 'me', username: 'Ja' },
      { id: 'u2', username: 'Alena' },
    ]);
    const user = userEvent.setup();
    wrap(
      <RecipientPicker value={null} onChange={vi.fn()} excludeId="me" />,
    );
    await user.type(screen.getByPlaceholderText(/Hledat uživatele/i), 'a');
    await user.type(screen.getByPlaceholderText(/Hledat uživatele/i), 'l');
    await screen.findByRole('button', { name: 'Alena' });
    expect(screen.queryByRole('button', { name: 'Ja' })).not.toBeInTheDocument();
  });
});
