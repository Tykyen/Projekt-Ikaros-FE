import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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
  highlighted: false,
  onDelete: vi.fn(),
  onReply: vi.fn(),
  onJumpToMessage: vi.fn(),
  onToggleReaction: vi.fn(),
  registerRef: vi.fn(),
};

describe('MessageItem', () => {
  it('vykreslí jméno a obsah veřejné zprávy', () => {
    render(<MessageItem {...baseProps} message={makeMsg()} />);
    expect(screen.getByText('Gandalf')).toBeInTheDocument();
    expect(screen.getByText('ahoj')).toBeInTheDocument();
  });

  // 4.2e §2 — avatar fallback hierarchie: snapshot > resolver > iniciála.
  it('snapshot senderAvatarUrl má přednost před resolverem', () => {
    const { container } = render(
      <MessageItem
        {...baseProps}
        message={makeMsg({ senderAvatarUrl: 'snap.webp' })}
        resolveAccountAvatar={() => 'live.webp'}
      />,
    );
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      'snap.webp',
    );
  });

  it('bez snapshotu padne na resolveAccountAvatar', () => {
    const { container } = render(
      <MessageItem
        {...baseProps}
        message={makeMsg()}
        resolveAccountAvatar={() => 'live.webp'}
      />,
    );
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      'live.webp',
    );
  });

  it('bez avataru i resolveru ukáže iniciálu (žádný img)', () => {
    const { container } = render(
      <MessageItem {...baseProps} message={makeMsg()} />,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('G')).toBeInTheDocument();
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

  it('tlačítko Odpovědět zavolá onReply se zprávou', () => {
    const onReply = vi.fn();
    const msg = makeMsg();
    render(<MessageItem {...baseProps} onReply={onReply} message={msg} />);
    fireEvent.click(screen.getByLabelText('Odpovědět'));
    expect(onReply).toHaveBeenCalledWith(msg);
  });

  it('vykreslí citaci a klik na ni skočí na originál', () => {
    const onJump = vi.fn();
    render(
      <MessageItem
        {...baseProps}
        onJumpToMessage={onJump}
        message={makeMsg({
          replyToId: 'orig',
          replyToSenderName: 'Frodo',
          replyToPreview: 'kde je prsten',
        })}
      />,
    );
    expect(screen.getByText('Frodo')).toBeInTheDocument();
    fireEvent.click(screen.getByText('kde je prsten'));
    expect(onJump).toHaveBeenCalledWith('orig');
  });

  it('vykreslí reaction chip se zvýrazněním mé reakce', () => {
    const onToggle = vi.fn();
    render(
      <MessageItem
        {...baseProps}
        onToggleReaction={onToggle}
        message={makeMsg({ reactions: { '👍': ['me', 'u2'] } })}
      />,
    );
    const chip = screen.getByLabelText('Reakce 👍, 2×');
    expect(chip).toBeInTheDocument();
    expect(chip.className).toMatch(/chipMine/);
    fireEvent.click(chip);
    expect(onToggle).toHaveBeenCalledWith('m1', '👍');
  });

  it('smazaná zpráva nevykreslí akce ani reakce', () => {
    render(
      <MessageItem
        {...baseProps}
        message={makeMsg({ isDeleted: true, reactions: { '👍': ['u2'] } })}
      />,
    );
    expect(screen.queryByLabelText('Odpovědět')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Reakce 👍, 1×')).not.toBeInTheDocument();
  });

  // 6.2-followup — maska s vazbou na kartu = klikací jméno.
  it('NPC s overridePageSlug + resolverem má klikací jméno (world chat)', () => {
    render(
      <MemoryRouter>
        <MessageItem
          {...baseProps}
          message={makeMsg({
            overrideName: 'Starý kovář',
            overridePageSlug: 'stary-kovar',
          })}
          resolveOverrideHref={(slug) => `/svet/matrix/postava/${slug}`}
        />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: /Starý kovář/ });
    expect(link).toHaveAttribute('href', '/svet/matrix/postava/stary-kovar');
  });

  it('NPC bez resolveru má jméno jako prostý text (globální chat)', () => {
    render(
      <MessageItem
        {...baseProps}
        message={makeMsg({
          overrideName: 'Starý kovář',
          overridePageSlug: 'stary-kovar',
        })}
      />,
    );
    expect(
      screen.queryByRole('link', { name: /Starý kovář/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Starý kovář')).toBeInTheDocument();
  });
});
