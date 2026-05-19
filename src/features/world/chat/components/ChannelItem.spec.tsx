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
  onSelect: () => {},
  onTogglePin: () => {},
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
});
