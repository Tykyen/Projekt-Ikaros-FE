import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatInput } from './ChatInput';
import type { ChatAttachment, ChatMessage, ChatUser } from '../lib/types';

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

const att: ChatAttachment = {
  url: 'https://res.cloudinary.com/c/global-chat/hospoda/a.png',
  publicId: 'global-chat/hospoda/a',
  type: 'image',
  mimeType: 'image/png',
  filename: 'a.png',
  size: 10,
};

function setup(overrides: Partial<React.ComponentProps<typeof ChatInput>> = {}) {
  const props = {
    disabled: false,
    users,
    currentUserId: 'me',
    replyTo: null,
    onSendPublic: vi.fn(),
    onSendWhisper: vi.fn(),
    onUploadAttachment: vi.fn().mockResolvedValue(att),
    onTypingStart: vi.fn(),
    onTypingStop: vi.fn(),
    onCancelReply: vi.fn(),
    ...overrides,
  };
  render(<ChatInput {...props} />);
  return props;
}

describe('ChatInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom neimplementuje object URL — náhledy příloh by jinak spadly.
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
  });

  it('Enter odešle veřejnou zprávu', () => {
    const p = setup();
    const input = screen.getByPlaceholderText(/hospody/);
    fireEvent.change(input, { target: { value: 'zdravím' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(p.onSendPublic).toHaveBeenCalledWith('zdravím', []);
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
    expect(p.onSendWhisper).toHaveBeenCalledWith('bob', 'pst', []);
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

  // ── Přílohy (4.3b) ──────────────────────────────────────────────────────

  it('výběr obrázku zobrazí náhled a zpřístupní odeslání', () => {
    setup();
    const file = new File(['x'], 'kresba.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Vybrat přílohy'), {
      target: { files: [file] },
    });
    expect(screen.getByAltText('kresba.png')).toBeInTheDocument();
    // Prázdný text, ale s přílohou — odeslat je aktivní.
    expect(screen.getByLabelText('Odeslat')).not.toBeDisabled();
  });

  it('křížek u náhledu přílohu odebere', () => {
    setup();
    const file = new File(['x'], 'kresba.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Vybrat přílohy'), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByLabelText('Odebrat kresba.png'));
    expect(screen.queryByAltText('kresba.png')).not.toBeInTheDocument();
  });

  it('nepodporovaný typ souboru se nepřidá', () => {
    setup();
    const bad = new File(['x'], 'virus.exe', {
      type: 'application/x-msdownload',
    });
    fireEvent.change(screen.getByLabelText('Vybrat přílohy'), {
      target: { files: [bad] },
    });
    expect(screen.queryByText('virus.exe')).not.toBeInTheDocument();
  });

  it('upload-on-send: nahraje přílohu a předá ji do onSendPublic', async () => {
    const onUploadAttachment = vi.fn().mockResolvedValue(att);
    const p = setup({ onUploadAttachment });
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Vybrat přílohy'), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByLabelText('Odeslat'));
    await waitFor(() =>
      expect(onUploadAttachment).toHaveBeenCalledWith(file),
    );
    await waitFor(() =>
      expect(p.onSendPublic).toHaveBeenCalledWith('', [att]),
    );
  });
});
