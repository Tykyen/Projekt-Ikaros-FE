import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ChatSearchModal } from './ChatSearchModal';
import type { ChatSearchResult, GroupWithChannels } from '../lib/types';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn() },
}));

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

  it('klik na výsledek předá channelId I messageId (skok na zprávu)', async () => {
    const result: ChatSearchResult = {
      messageId: 'm42',
      channelId: 'c1',
      channelName: 'globální',
      senderName: 'abi',
      content: 'hledaná zpráva',
      createdAt: new Date().toISOString(),
    };
    vi.mocked(api.get).mockResolvedValue([result]);
    const onSelectResult = vi.fn();
    wrap(<ChatSearchModal {...props} onSelectResult={onSelectResult} />);

    fireEvent.change(screen.getByPlaceholderText(/hledej slovo/i), {
      target: { value: 'hledaná' },
    });
    // Debounce 350 ms → počkej, až se výsledek vykreslí.
    const item = await screen.findByText(
      'hledaná zpráva',
      undefined,
      { timeout: 2000 },
    );
    fireEvent.click(item.closest('button')!);
    expect(onSelectResult).toHaveBeenCalledWith('c1', 'm42');
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
