import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RequestsList } from './RequestsList';
import type { WorldPendingActionItem } from '@/features/world/api/useWorldPendingActions';

const approveMutate = vi.fn();
const rejectMutate = vi.fn();
vi.mock('@/features/world/api/useWorldJoin', () => ({
  useApproveAccessRequest: () => ({ mutate: approveMutate, isPending: false }),
  useRejectAccessRequest: () => ({ mutate: rejectMutate, isPending: false }),
}));

function item(
  over: Partial<WorldPendingActionItem> = {},
): WorldPendingActionItem {
  return {
    type: 'access-request',
    id: 'ar1',
    userId: 'u2',
    displayName: 'Žadatel',
    createdAt: new Date().toISOString(),
    ...over,
  };
}

describe('RequestsList (15.10)', () => {
  beforeEach(() => {
    approveMutate.mockClear();
    rejectMutate.mockClear();
  });

  it('prázdný seznam → „Nic ke zpracování"', () => {
    render(<RequestsList worldId="w1" items={[]} />);
    expect(screen.getByText('Nic ke zpracování.')).toBeInTheDocument();
  });

  it('vykreslí žadatele se štítkem a akcemi', () => {
    render(<RequestsList worldId="w1" items={[item()]} />);
    expect(screen.getByText('Žadatel')).toBeInTheDocument();
    expect(screen.getByText(/Žádá o vstup/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Přijmout' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Odmítnout' }),
    ).toBeInTheDocument();
  });

  it('položka s postavou → „Chce hrát jako {name}"', () => {
    render(
      <RequestsList worldId="w1" items={[item({ characterName: 'Vlkodav' })]} />,
    );
    expect(screen.getByText(/Chce hrát jako Vlkodav/)).toBeInTheDocument();
  });

  it('Přijmout → mutate s worldId + requestId', () => {
    render(<RequestsList worldId="w1" items={[item({ id: 'ar9' })]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Přijmout' }));
    expect(approveMutate).toHaveBeenCalledWith({
      worldId: 'w1',
      requestId: 'ar9',
    });
  });

  it('Odmítnout → mutate reject s worldId + requestId', () => {
    render(<RequestsList worldId="w1" items={[item({ id: 'ar9' })]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Odmítnout' }));
    expect(rejectMutate).toHaveBeenCalledWith({
      worldId: 'w1',
      requestId: 'ar9',
    });
  });
});
