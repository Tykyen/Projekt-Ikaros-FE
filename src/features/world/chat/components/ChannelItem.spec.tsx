import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChannelItem } from './ChannelItem';
import type { ChatChannel } from '../lib/types';

const channel = (over?: Partial<ChatChannel>): ChatChannel => ({
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
  lastMessagePreview: 'Ahoj všem',
  ...over,
});

const baseProps = {
  active: false,
  unread: 0,
  pinned: false,
  accentColor: 'red',
  canManage: false,
  onSelect: () => {},
  onTogglePin: () => {},
  onEdit: () => {},
};

describe('ChannelItem', () => {
  it('zobrazí název konverzace a náhled poslední zprávy', () => {
    render(<ChannelItem channel={channel()} {...baseProps} />);
    expect(screen.getByText('obecný')).toBeInTheDocument();
    expect(screen.getByText('Ahoj všem')).toBeInTheDocument();
  });

  it('zobrazí unread badge a > 99 zkrátí na 99+', () => {
    const { rerender } = render(
      <ChannelItem channel={channel()} {...baseProps} unread={5} />,
    );
    expect(screen.getByText('5')).toBeInTheDocument();
    rerender(<ChannelItem channel={channel()} {...baseProps} unread={150} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('bez unread badge nezobrazí', () => {
    render(<ChannelItem channel={channel()} {...baseProps} unread={0} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('klik na řádek volá onSelect', async () => {
    const onSelect = vi.fn();
    render(
      <ChannelItem channel={channel()} {...baseProps} onSelect={onSelect} />,
    );
    await userEvent.click(screen.getByText('obecný'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('pin tlačítko volá onTogglePin', async () => {
    const onTogglePin = vi.fn();
    render(
      <ChannelItem
        channel={channel()}
        {...baseProps}
        onTogglePin={onTogglePin}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Připnout/ }));
    expect(onTogglePin).toHaveBeenCalledTimes(1);
  });

  it('Settings ikona viditelná jen pro canManage', () => {
    const { rerender } = render(
      <ChannelItem channel={channel()} {...baseProps} canManage={false} />,
    );
    expect(
      screen.queryByRole('button', { name: /Upravit konverzaci/ }),
    ).not.toBeInTheDocument();

    rerender(
      <ChannelItem channel={channel()} {...baseProps} canManage={true} />,
    );
    expect(
      screen.getByRole('button', { name: /Upravit konverzaci/ }),
    ).toBeInTheDocument();
  });

  it('klik na Settings volá onEdit', async () => {
    const onEdit = vi.fn();
    render(
      <ChannelItem
        channel={channel()}
        {...baseProps}
        canManage={true}
        onEdit={onEdit}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Upravit konverzaci/ }),
    );
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('imageUrl renderuje thumbnail místo ikony accessMode', () => {
    const { container } = render(
      <ChannelItem
        channel={channel({ imageUrl: 'https://img/ch.png' })}
        {...baseProps}
      />,
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('src', 'https://img/ch.png');
  });
});
