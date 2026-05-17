import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AkjType } from '@/shared/types';
import { AkjLevelEditor } from '../components/AkjLevelEditor';

const mutateAsync = vi.fn().mockResolvedValue({});
const toastError = vi.fn();
const toastSuccess = vi.fn();

vi.mock('@/features/world/api/useUpdateAkjTypes', () => ({
  useUpdateAkjTypes: () => ({ mutateAsync, isPending: false }),
}));
vi.mock('sonner', () => ({
  toast: { error: (m: string) => toastError(m), success: (m: string) => toastSuccess(m) },
}));

const INITIAL: AkjType[] = [
  { key: 'b', name: 'Tajný spis', level: 2 },
  { key: 'a', name: 'Veřejné', level: 0 },
];

describe('AkjLevelEditor', () => {
  beforeEach(() => {
    mutateAsync.mockClear();
    toastError.mockClear();
    toastSuccess.mockClear();
  });

  it('vykreslí počáteční úrovně', () => {
    render(<AkjLevelEditor worldId="w1" initial={INITIAL} />);
    expect(screen.getByDisplayValue('Veřejné')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tajný spis')).toBeInTheDocument();
  });

  it('„Přidat úroveň" vloží nový prázdný řádek', async () => {
    render(<AkjLevelEditor worldId="w1" initial={INITIAL} />);
    await userEvent.click(screen.getByRole('button', { name: 'Přidat úroveň' }));
    expect(screen.getAllByPlaceholderText(/Veřejné, Tajný spis/)).toHaveLength(3);
  });

  it('uložení s prázdným názvem zobrazí chybu a neukládá', async () => {
    render(<AkjLevelEditor worldId="w1" initial={[]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Přidat úroveň' }));
    await userEvent.click(screen.getByRole('button', { name: 'Uložit úrovně' }));
    expect(toastError).toHaveBeenCalled();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('uložení validních úrovní volá mutaci', async () => {
    render(<AkjLevelEditor worldId="w1" initial={INITIAL} />);
    await userEvent.click(screen.getByRole('button', { name: 'Uložit úrovně' }));
    expect(mutateAsync).toHaveBeenCalledTimes(1);
    const arg = mutateAsync.mock.calls[0][0] as AkjType[];
    expect(arg).toHaveLength(2);
  });
});
