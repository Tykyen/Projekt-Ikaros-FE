import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from './ChatInput';
import type { ChatUser } from '../lib/types';

const users: ChatUser[] = [
  { userId: 'me', username: 'Já' },
  { userId: 'bob', username: 'Bob' },
];

function setup(overrides: Partial<React.ComponentProps<typeof ChatInput>> = {}) {
  const props = {
    disabled: false,
    users,
    currentUserId: 'me',
    onSendPublic: vi.fn(),
    onSendWhisper: vi.fn(),
    onTypingStart: vi.fn(),
    onTypingStop: vi.fn(),
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
});
