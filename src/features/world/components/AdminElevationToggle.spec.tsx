import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminElevationToggle } from './AdminElevationToggle';

const mutateElevate = vi.fn();
const mutateDeElevate = vi.fn();

vi.mock('../api/useWorldElevation', () => ({
  useElevateWorld: () => ({ mutate: mutateElevate, isPending: false }),
  useDeElevateWorld: () => ({ mutate: mutateDeElevate, isPending: false }),
}));

describe('AdminElevationToggle', () => {
  beforeEach(() => {
    mutateElevate.mockClear();
    mutateDeElevate.mockClear();
  });

  it('de-elevated: klik s potvrzením → elevate(worldId)', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<AdminElevationToggle worldId="w1" elevated={false} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mutateElevate).toHaveBeenCalledWith('w1');
  });

  it('de-elevated: klik bez potvrzení → nic se nestane', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<AdminElevationToggle worldId="w1" elevated={false} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mutateElevate).not.toHaveBeenCalled();
  });

  it('elevated: klik → deElevate(worldId) bez potvrzení', () => {
    render(<AdminElevationToggle worldId="w1" elevated />);
    fireEvent.click(screen.getByRole('button'));
    expect(mutateDeElevate).toHaveBeenCalledWith('w1');
  });

  it('elevated stav má aria-pressed=true', () => {
    render(<AdminElevationToggle worldId="w1" elevated />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });
});
