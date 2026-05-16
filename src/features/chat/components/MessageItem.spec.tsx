import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageItem } from './MessageItem';
import type { ChatMessage } from '../lib/types';

const makeMsg = (o: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'm1',
  channelId: 'ch1',
  worldId: null,
  senderId: 'u1',
  senderName: 'Gandalf',
  content: 'ahoj',
  color: null,
  isEdited: false,
  isDeleted: false,
  reactions: {},
  createdAt: '2026-05-16T14:30:00Z',
  updatedAt: '2026-05-16T14:30:00Z',
  ...o,
});

const baseProps = {
  currentUserId: 'me',
  grouped: false,
  surfaceColor: '#1a0f06',
  canDelete: false,
  usersById: new Map<string, string>(),
  onDelete: vi.fn(),
};

describe('MessageItem', () => {
  it('vykreslí jméno a obsah veřejné zprávy', () => {
    render(<MessageItem {...baseProps} message={makeMsg()} />);
    expect(screen.getByText('Gandalf')).toBeInTheDocument();
    expect(screen.getByText('ahoj')).toBeInTheDocument();
  });

  it('nahradí emote shortcode', () => {
    render(<MessageItem {...baseProps} message={makeMsg({ content: 'dáme :beer:' })} />);
    expect(screen.getByText('dáme 🍺')).toBeInTheDocument();
  });

  it('smazaná zpráva ukáže placeholder', () => {
    render(<MessageItem {...baseProps} message={makeMsg({ isDeleted: true })} />);
    expect(screen.getByText('Zpráva byla smazána')).toBeInTheDocument();
  });

  it('whisper ukáže popisek šepotu', () => {
    render(
      <MessageItem
        {...baseProps}
        message={makeMsg({ senderId: 'me', visibleTo: ['me', 'bob'] })}
        usersById={new Map([['bob', 'Bob']])}
      />,
    );
    expect(screen.getByText(/šepot/)).toBeInTheDocument();
    expect(screen.getByText(/→ Bob/)).toBeInTheDocument();
  });

  it('skrytá hlavička u seskupené zprávy', () => {
    render(<MessageItem {...baseProps} grouped message={makeMsg()} />);
    expect(screen.queryByText('Gandalf')).not.toBeInTheDocument();
  });

  it('admin delete tlačítko zavolá onDelete', () => {
    const onDelete = vi.fn();
    render(
      <MessageItem {...baseProps} canDelete onDelete={onDelete} message={makeMsg()} />,
    );
    fireEvent.click(screen.getByLabelText('Smazat zprávu'));
    expect(onDelete).toHaveBeenCalledWith('m1');
  });
});
