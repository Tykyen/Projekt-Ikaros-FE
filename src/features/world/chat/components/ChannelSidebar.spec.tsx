import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  onEditGroup: () => {},
  onEditChannel: () => {},
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

  it('Settings ikony pro kanál i konverzaci se zobrazí jen pro PJ', () => {
    render(<ChannelSidebar groups={groups} canManage={false} {...baseProps} />);
    expect(
      screen.queryByRole('button', { name: /Upravit kanál/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Upravit konverzaci/ }),
    ).not.toBeInTheDocument();
  });

  it('klik na Settings u kanálu předá konkrétní group do onEditGroup', async () => {
    const onEditGroup = vi.fn();
    render(
      <ChannelSidebar
        groups={groups}
        canManage
        {...baseProps}
        onEditGroup={onEditGroup}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Upravit kanál/ }),
    );
    expect(onEditGroup).toHaveBeenCalledWith(groups[0].group);
  });

  it('klik na Settings u konverzace předá konkrétní channel do onEditChannel', async () => {
    const onEditChannel = vi.fn();
    render(
      <ChannelSidebar
        groups={groups}
        canManage
        {...baseProps}
        onEditChannel={onEditChannel}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Upravit konverzaci/ }),
    );
    expect(onEditChannel).toHaveBeenCalledWith(groups[0].channels[0]);
  });
});
