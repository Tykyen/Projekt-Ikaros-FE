import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChannelSidebar } from './ChannelSidebar';
import type { GroupWithChannels } from '../lib/types';

const groups: GroupWithChannels[] = [
  {
    group: { id: 'g1', worldId: 'w1', name: 'Globální', order: 0 },
    channels: [
      {
        id: 'c1',
        groupId: 'g1',
        worldId: 'w1',
        name: 'obecný',
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

const baseProps = {
  activeChannelId: null,
  unread: new Map<string, number>(),
  onSelectChannel: () => {},
  onAddGroup: () => {},
  onAddChannel: () => {},
};

describe('ChannelSidebar', () => {
  it('vykreslí kanály a jejich konverzace', () => {
    render(
      <ChannelSidebar groups={groups} canManage={false} {...baseProps} />,
    );
    expect(screen.getByText('Globální')).toBeInTheDocument();
    expect(screen.getByText('obecný')).toBeInTheDocument();
  });

  it('prázdný stav když svět nemá žádné kanály', () => {
    render(<ChannelSidebar groups={[]} canManage={false} {...baseProps} />);
    expect(screen.getByText(/žádné kanály/i)).toBeInTheDocument();
  });

  it('tlačítko „Nový kanál" jen pro PJ (canManage)', () => {
    const { rerender } = render(
      <ChannelSidebar groups={groups} canManage={false} {...baseProps} />,
    );
    expect(
      screen.queryByRole('button', { name: /Nový kanál/ }),
    ).not.toBeInTheDocument();
    rerender(
      <ChannelSidebar groups={groups} canManage {...baseProps} />,
    );
    expect(
      screen.getByRole('button', { name: /Nový kanál/ }),
    ).toBeInTheDocument();
  });
});
