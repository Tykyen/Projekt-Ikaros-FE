import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CharacterTabsVisibilityTab from '../tabs/CharacterTabsVisibilityTab';
import type { WorldSettings } from '@/shared/types';

const mutateAsync = vi.fn().mockResolvedValue({});
const toastSuccess = vi.fn();
const toastError = vi.fn();

let mockSettings: WorldSettings | undefined;
let mockLoading = false;

vi.mock('@/features/world/api/useWorldSettings', () => ({
  useWorldSettings: () => ({ data: mockSettings, isLoading: mockLoading }),
}));
vi.mock('@/features/world/api/useUpdateWorldSettings', () => ({
  useUpdateWorldSettings: () => ({ mutateAsync, isPending: false }),
}));
vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({ world: { id: 'w1', slug: 'matrix' } }),
}));
vi.mock('sonner', () => ({
  toast: {
    success: (m: string) => toastSuccess(m),
    error: (m: string) => toastError(m),
  },
}));

function baseSettings(
  override?: Partial<WorldSettings>,
): WorldSettings {
  return {
    id: 's1',
    worldId: 'w1',
    hiddenNavItems: [],
    customGroups: [],
    groupColors: {},
    akjTypes: [],
    hideDefaultWeather: false,
    timelineCalendarSlug: null,
    updatedAt: '',
    ...override,
  };
}

describe('CharacterTabsVisibilityTab', () => {
  beforeEach(() => {
    mutateAsync.mockClear();
    toastSuccess.mockClear();
    toastError.mockClear();
    mockSettings = baseSettings();
    mockLoading = false;
  });

  // DOM obsahuje desktop matrix + mobile sections současně (CSS media query
  // řídí viditelnost). Test musí počítat se zdvojeným renderem: 2× (1 disabled
  // Profil + 5 togglů) × 2 layouty = 24 checkboxů.
  it('výchozí stav = všechny taby zaškrtnuté (kromě profilu, který je vždy disabled)', () => {
    render(<CharacterTabsVisibilityTab />);
    const allCheckboxes = screen.getAllByRole('checkbox');
    expect(allCheckboxes).toHaveLength(24);

    const disabled = allCheckboxes.filter((c) => c.hasAttribute('disabled'));
    expect(disabled).toHaveLength(4); // 2× Profil × 2 layouty
    disabled.forEach((c) => expect(c).toBeChecked());

    const enabled = allCheckboxes.filter((c) => !c.hasAttribute('disabled'));
    enabled.forEach((c) => expect(c).toBeChecked());
  });

  it('klik na checkbox → tlačítko Uložit povoleno', async () => {
    const user = userEvent.setup();
    render(<CharacterTabsVisibilityTab />);
    const saveBtn = screen.getByRole('button', { name: /Uložit změny/i });
    expect(saveBtn).toBeDisabled();

    const deniks = screen.getAllByRole('checkbox', {
      name: /Deník — Postava hráče/,
    });
    await user.click(deniks[0]);
    deniks.forEach((c) => expect(c).not.toBeChecked());
    expect(saveBtn).not.toBeDisabled();
  });

  it('Reset vrátí všechny taby na zaškrtnuto', async () => {
    const user = userEvent.setup();
    mockSettings = baseSettings({
      characterTabVisibility: {
        PostavaHrace: ['denik'],
        NPC: ['kalendar'],
      },
    });
    render(<CharacterTabsVisibilityTab />);

    const reset = screen.getByRole('button', { name: /Resetovat/i });
    await user.click(reset);

    const allEnabled = screen
      .getAllByRole('checkbox')
      .filter((c) => !c.hasAttribute('disabled'));
    allEnabled.forEach((c) => expect(c).toBeChecked());
  });

  it('Save volá mutateAsync s aktuálním stavem', async () => {
    const user = userEvent.setup();
    render(<CharacterTabsVisibilityTab />);

    const deniks = screen.getAllByRole('checkbox', {
      name: /Deník — Postava hráče/,
    });
    await user.click(deniks[0]);

    const saveBtn = screen.getByRole('button', { name: /Uložit změny/i });
    await user.click(saveBtn);

    expect(mutateAsync).toHaveBeenCalledTimes(1);
    const arg = mutateAsync.mock.calls[0][0];
    expect(arg.characterTabVisibility.PostavaHrace).not.toContain('denik');
    expect(arg.characterTabVisibility.PostavaHrace).toContain('finance');
    expect(arg.characterTabVisibility.NPC).toHaveLength(5);
    expect(toastSuccess).toHaveBeenCalledWith('Nastavení uloženo');
  });

  it('Error toast když mutace selže', async () => {
    mutateAsync.mockRejectedValueOnce(new Error('boom'));
    const user = userEvent.setup();
    render(<CharacterTabsVisibilityTab />);
    const npcDeniks = screen.getAllByRole('checkbox', {
      name: /Deník — NPC/,
    });
    await user.click(npcDeniks[0]);
    await user.click(screen.getByRole('button', { name: /Uložit změny/i }));
    expect(toastError).toHaveBeenCalledWith('Uložení selhalo');
  });
});
