import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ChatSearchModal } from './ChatSearchModal';
import type { GroupWithChannels } from '../lib/types';

const groups: GroupWithChannels[] = [
  {
    group: { id: 'g1', worldId: 'w1', name: 'Globální', order: 0 },
    channels: [
      {
        id: 'c1',
        groupId: 'g1',
        worldId: 'w1',
        name: 'globální',
        isGlobal: false,
        accessMode: 'all',
        allowedRoles: [],
        allowedMemberIds: [],
        order: 0,
        type: 'all',
      },
    ],
  },
];

function wrap(ui: ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>{ui}</QueryClientProvider>,
  );
}

const props = {
  worldId: 'w1',
  groups,
  onClose: () => {},
  onSelectResult: () => {},
};

describe('ChatSearchModal', () => {
  it('zobrazí nápovědu, dokud je dotaz kratší než 2 znaky', () => {
    wrap(<ChatSearchModal {...props} />);
    expect(screen.getByText(/alespoň 2 znaky/i)).toBeInTheDocument();
  });

  it('filtr nabízí konverzace světa + volbu „všechny"', () => {
    wrap(<ChatSearchModal {...props} />);
    expect(
      screen.getByRole('option', { name: 'Všechny konverzace' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'globální' }),
    ).toBeInTheDocument();
  });
});
