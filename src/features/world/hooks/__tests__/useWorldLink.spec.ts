import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWorldLink } from '../useWorldLink';
import { WorldRole } from '@/shared/types';

const mockUseMyWorlds = vi.fn();

vi.mock('@/features/world/api/useWorlds', () => ({
  useMyWorlds: () => mockUseMyWorlds(),
}));

describe('useWorldLink (Spec 2.4)', () => {
  beforeEach(() => {
    mockUseMyWorlds.mockReset();
  });

  it('member tohoto světa → /svet/:id', () => {
    mockUseMyWorlds.mockReturnValue({
      data: [
        {
          world: { id: 'w1' },
          membership: { role: WorldRole.Hrac },
        },
      ],
    });
    const { result } = renderHook(() => useWorldLink('w1'));
    expect(result.current).toBe('/svet/w1');
  });

  it('non-member (anon, žádné myWorlds) → /svet/:id/info', () => {
    mockUseMyWorlds.mockReturnValue({ data: undefined });
    const { result } = renderHook(() => useWorldLink('w1'));
    expect(result.current).toBe('/svet/w1/info');
  });

  it('Zadatel (pending) → /svet/:id/info (ne member)', () => {
    mockUseMyWorlds.mockReturnValue({
      data: [
        {
          world: { id: 'w1' },
          membership: { role: WorldRole.Zadatel },
        },
      ],
    });
    const { result } = renderHook(() => useWorldLink('w1'));
    expect(result.current).toBe('/svet/w1/info');
  });

  it('member jiného světa → /svet/:id/info pro tento (nečlen)', () => {
    mockUseMyWorlds.mockReturnValue({
      data: [
        {
          world: { id: 'w2' },
          membership: { role: WorldRole.Hrac },
        },
      ],
    });
    const { result } = renderHook(() => useWorldLink('w1'));
    expect(result.current).toBe('/svet/w1/info');
  });
});
