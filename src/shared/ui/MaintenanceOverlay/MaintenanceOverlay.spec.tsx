import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getDefaultStore } from 'jotai';
import { backendUnavailableAtom } from '@/shared/store/backendStatus';

vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: { status: 'ok' } }) },
}));

import { MaintenanceOverlay } from './MaintenanceOverlay';

function renderOverlay() {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MaintenanceOverlay />
    </QueryClientProvider>,
  );
}

describe('MaintenanceOverlay', () => {
  beforeEach(() => {
    getDefaultStore().set(backendUnavailableAtom, false);
  });

  it('je skrytý, když backend běží', () => {
    renderOverlay();
    expect(screen.queryByText(/Probíhá údržba/)).not.toBeInTheDocument();
  });

  it('zobrazí údržbovou hlášku při výpadku BE', () => {
    getDefaultStore().set(backendUnavailableAtom, true);
    renderOverlay();
    expect(screen.getByText(/Probíhá údržba/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Zkusit hned/ }),
    ).toBeInTheDocument();
  });
});
