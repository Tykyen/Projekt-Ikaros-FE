import { describe, it, expect } from 'vitest';
import { toChatItems } from './chatItems';
import type { ChatMessage } from './types';

const msg = (over: Partial<ChatMessage>): ChatMessage => ({
  id: 'm1',
  channelId: 'c',
  worldId: null,
  senderId: 'u1',
  senderName: 'A',
  content: 'ahoj',
  color: null,
  isEdited: false,
  isDeleted: false,
  reactions: {},
  createdAt: '2026-05-16T10:00:00.000Z',
  updatedAt: '2026-05-16T10:00:00.000Z',
  ...over,
});

describe('toChatItems', () => {
  it('zpráva s isSystem → system item', () => {
    const items = toChatItems([
      msg({ id: 's1', isSystem: true, content: 'X přišel' }),
    ]);
    expect(items).toEqual([
      {
        kind: 'system',
        id: 's1',
        text: 'X přišel',
        at: '2026-05-16T10:00:00.000Z',
      },
    ]);
  });

  it('běžná zpráva → message item', () => {
    const m = msg({ id: 'm1' });
    expect(toChatItems([m])).toEqual([{ kind: 'message', message: m }]);
  });

  it('řadí položky vzestupně dle createdAt', () => {
    const a = msg({ id: 'a', createdAt: '2026-05-16T10:00:00.000Z' });
    const b = msg({ id: 'b', createdAt: '2026-05-16T09:00:00.000Z' });
    const ids = toChatItems([a, b]).map((i) =>
      i.kind === 'message' ? i.message.id : i.id,
    );
    expect(ids).toEqual(['b', 'a']);
  });

  it('systémová zpráva bez obsahu → prázdný text', () => {
    const items = toChatItems([msg({ id: 's', isSystem: true, content: null })]);
    expect(items[0]).toMatchObject({ kind: 'system', text: '' });
  });
});
