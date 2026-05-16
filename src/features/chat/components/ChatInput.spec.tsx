import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from './ChatInput';
import type { ChatMessage, ChatUser } from '../lib/types';

const users: ChatUser[] = [
  { userId: 'me', username: 'Já' },
  { userId: 'bob', username: 'Bob' },
];

const makeMsg = (o: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'm1',
  channelId: 'ch1',
  worldId: null,
  senderId: 'bob',
  senderName: 'Bob',
  content: 'původní zpráva',
  color: null,
  isEdited: false,
  isDeleted: false,
  reactions: {},
  createdAt: '2026-05-16T14:30:00Z',
  updatedAt: '2026-05-16T14:30:00Z',
  ...o,
});

function setup(overrides: Partial<React.ComponentProps<typeof ChatInput>> = {}) {
  const props = {
    disabled: false,
    users,
    currentUserId: 'me',
    replyTo: null,
    onSendPublic: vi.fn(),
    onSendWhisper: vi.fn(),
    onTypingStart: vi.fn(),
    onTypingStop: vi.fn(),
    onCancelReply: vi.fn(),
    ...overrides,
  };
  render(<ChatInput {...props} />);
  return props;
}

describe('ChatInput', () => {
  beforeEach(() => vi.clearAllMocks());

  it('Enter odešle veřejnou zprávu', () => {
    const p = setup();
    const input = screen.getByPlaceholderText(/hospody/);
    fireEvent.change(input, { target: { value: 'zdravím' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(p.onSendPublic).toHaveBeenCalledWith('zdravím');
  });

  it('prázdná zpráva se neodešle', () => {
    const p = setup();
    fireEvent.keyDown(screen.getByPlaceholderText(/hospody/), { key: 'Enter' });
    expect(p.onSendPublic).not.toHaveBeenCalled();
  });

  it('psaní spustí onTypingStart', () => {
    const p = setup();
    fireEvent.change(screen.getByPlaceholderText(/hospody/), {
      target: { value: 'p' },
    });
    expect(p.onTypingStart).toHaveBeenCalled();
  });

  it('zvolený cíl → odešle whisper', () => {
    const p = setup();
    fireEvent.change(screen.getByLabelText('Komu napsat'), {
      target: { value: 'bob' },
    });
    const input = screen.getByPlaceholderText(/Šeptaná/);
    fireEvent.change(input, { target: { value: 'pst' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(p.onSendWhisper).toHaveBeenCalledWith('bob', 'pst');
    expect(p.onSendPublic).not.toHaveBeenCalled();
  });

  it('odeslat tlačítko je disabled u prázdného pole', () => {
    setup();
    expect(screen.getByLabelText('Odeslat')).toBeDisabled();
  });

  it('reply lišta ukáže autora i úryvek citované zprávy', () => {
    setup({ replyTo: makeMsg() });
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('původní zpráva')).toBeInTheDocument();
  });

  it('křížek v reply liště zavolá onCancelReply', () => {
    const p = setup({ replyTo: makeMsg() });
    fireEvent.click(screen.getByLabelText('Zrušit odpověď'));
    expect(p.onCancelReply).toHaveBeenCalled();
  });

  it('bez replyTo se reply lišta nevykreslí', () => {
    setup();
    expect(screen.queryByLabelText('Zrušit odpověď')).not.toBeInTheDocument();
  });
});
