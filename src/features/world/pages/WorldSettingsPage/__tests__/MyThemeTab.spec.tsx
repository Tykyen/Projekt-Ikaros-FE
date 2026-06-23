import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { World, WorldMembership } from '@/shared/types';

const mutateAsync = vi.fn().mockResolvedValue({});

vi.mock('@/features/world/api/useUpdateMyWorldTheme', () => ({
  useUpdateMyWorldTheme: () => ({ mutateAsync, isPending: false }),
}));
vi.mock('@/shared/api', () => ({
  useUploadImage: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
// ThemeCustomEditor renderuje barevné inputy — pro tento test irelevantní.
vi.mock('../components/ThemeCustomEditor', () => ({
  ThemeCustomEditor: () => null,
}));

const membership = vi.hoisted(() => ({
  current: undefined as WorldMembership | undefined,
}));
vi.mock('@/features/world/api/useWorldStatus', () => ({
  useWorldStatus: () => ({ membership: membership.current }),
}));

const world = {
  id: 'w1',
  slug: 'svet',
  name: 'Svět',
  themeId: 'ikaros',
  themeOverrides: {},
  themeBackgroundUrl: undefined,
} as unknown as World;

vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({ world }),
}));

async function renderTab() {
  const { default: MyThemeTab } = await import('../tabs/MyThemeTab');
  return render(<MyThemeTab />);
}

describe('MyThemeTab — per-člen motiv/pozadí (5.9b)', () => {
  beforeEach(() => {
    mutateAsync.mockClear();
    membership.current = undefined;
  });

  it('bez změny motivu uloží themeId: null (sleduj PJ)', async () => {
    await renderTab();
    fireEvent.click(screen.getByRole('button', { name: /Uložit můj vzhled/i }));
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ themeId: null, themeBackgroundUrl: null }),
      ),
    );
  });

  it('volba jiného motivu uloží vlastní themeId (jen pro mě)', async () => {
    await renderTab();
    fireEvent.click(screen.getByRole('radio', { name: 'Fantasy' }));
    fireEvent.click(screen.getByRole('button', { name: /Uložit můj vzhled/i }));
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ themeId: 'fantasy' }),
      ),
    );
  });

  it('předvyplní motiv z membershipu (vlastní volba člena)', async () => {
    membership.current = {
      themeId: 'cyberpunk',
    } as unknown as WorldMembership;
    await renderTab();
    expect(screen.getByRole('radio', { name: 'Cyberpunk' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});
