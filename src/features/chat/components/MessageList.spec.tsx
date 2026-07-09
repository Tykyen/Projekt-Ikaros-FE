import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MessageList } from './MessageList';
import type { ChatItem, ChatMessage } from '../lib/types';

// jsdom nemá scrollIntoView ani ResizeObserver — MessageList je interně používá
// (auto-scroll na konec + drž-u-dna). Stubneme je, ať render projde.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

beforeEach(() => vi.clearAllMocks());

const msg = (id: string): ChatMessage => ({
  id,
  channelId: 'ch1',
  worldId: 'w1',
  senderId: 'u1',
  senderName: 'Aragorn',
  content: `text ${id}`,
  color: null,
  isEdited: false,
  isDeleted: false,
  reactions: {},
  createdAt: '2026-06-18T10:00:00Z',
  updatedAt: '2026-06-18T10:00:00Z',
});

const items: ChatItem[] = [
  { kind: 'message', message: msg('m1') },
  { kind: 'message', message: msg('m2') },
];

const base = {
  items,
  currentUserId: 'me',
  surfaceColor: '#000',
  canDelete: false,
  usersById: new Map<string, string>(),
  onDelete: vi.fn(),
  onReply: vi.fn(),
  onToggleReaction: vi.fn(),
};

const renderList = (jumpToMessageId?: string | null) =>
  render(
    <MemoryRouter>
      <MessageList {...base} jumpToMessageId={jumpToMessageId} />
    </MemoryRouter>,
  );

/** Skok = scrollIntoView s `block: 'center'` (auto-scroll na konec ho nemá). */
function jumpCalled(spy: { mock: { calls: unknown[][] } }): boolean {
  return spy.mock.calls.some((call) => {
    const arg = call[0] as ScrollIntoViewOptions | boolean | undefined;
    return typeof arg === 'object' && arg !== null && arg.block === 'center';
  });
}

describe('MessageList — deep-link skok na zprávu (13.2a)', () => {
  it('doscrolluje na zprávu z jumpToMessageId (block: center)', () => {
    const spy = vi.spyOn(Element.prototype, 'scrollIntoView');
    renderList('m2');
    expect(jumpCalled(spy)).toBe(true);
  });

  it('bez jumpToMessageId neskáče (jen auto-scroll na konec)', () => {
    const spy = vi.spyOn(Element.prototype, 'scrollIntoView');
    renderList(null);
    expect(jumpCalled(spy)).toBe(false);
  });

  it('jumpToMessageId mimo načtené okno = no-op (neskáče)', () => {
    const spy = vi.spyOn(Element.prototype, 'scrollIntoView');
    renderList('neznama-zprava');
    expect(jumpCalled(spy)).toBe(false);
  });
});

describe('MessageList — tlačítko „Zobrazit starší" (SC-33)', () => {
  const renderWith = (props: Partial<Parameters<typeof MessageList>[0]>) =>
    render(
      <MemoryRouter>
        <MessageList {...base} {...props} />
      </MemoryRouter>,
    );

  it('bez props se tlačítko nezobrazí (default off — global/admin chat)', () => {
    renderWith({});
    expect(screen.queryByText(/starší zprávy/i)).toBeNull();
  });

  it('hasMoreOlder → zobrazí tlačítko a klik volá onLoadOlder', () => {
    const onLoadOlder = vi.fn();
    renderWith({ hasMoreOlder: true, onLoadOlder });
    const btn = screen.getByRole('button', { name: /starší zprávy/i });
    fireEvent.click(btn);
    expect(onLoadOlder).toHaveBeenCalledTimes(1);
  });

  it('loadingOlder → tlačítko disabled s textem „Načítám…"', () => {
    const onLoadOlder = vi.fn();
    renderWith({ hasMoreOlder: true, loadingOlder: true, onLoadOlder });
    const btn = screen.getByRole('button', { name: /načítám starší/i });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onLoadOlder).not.toHaveBeenCalled();
  });
});
