import { describe, it, expect } from 'vitest';
import { applyUnreadEvent, prependOlderMessages } from './useWorldChat';
import type { ChannelUnread } from '../lib/types';
import type { ChatMessage } from '@/features/chat/lib/types';

const msg = (id: string): ChatMessage => ({ id }) as unknown as ChatMessage;

describe('prependOlderMessages', () => {
  it('předsadí starší dávku před stávající zprávy', () => {
    const out = prependOlderMessages([msg('c'), msg('d')], [msg('a'), msg('b')]);
    expect(out.map((m) => m.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('deduplikuje překryv (ponechá jednu kopii, pořadí zachová)', () => {
    const out = prependOlderMessages([msg('b'), msg('c')], [msg('a'), msg('b')]);
    expect(out.map((m) => m.id)).toEqual(['a', 'b', 'c']);
  });

  it('prázdná dávka → vrátí původní referenci (žádný re-render)', () => {
    const cur = [msg('a')];
    expect(prependOlderMessages(cur, [])).toBe(cur);
  });

  it('celá dávka duplicitní → vrátí původní referenci', () => {
    const cur = [msg('a'), msg('b')];
    expect(prependOlderMessages(cur, [msg('a')])).toBe(cur);
  });
});

describe('applyUnreadEvent', () => {
  const seed: ChannelUnread[] = [
    { channelId: 'a', mentionCount: 0, count:2 },
    { channelId: 'b', mentionCount: 0, count:0 },
  ];

  it('absolutní count přepíše hodnotu existujícího kanálu', () => {
    const out = applyUnreadEvent(seed, { channelId: 'a', mentionCount: 0, count:5 });
    expect(out.find((u) => u.channelId === 'a')?.count).toBe(5);
    expect(out.find((u) => u.channelId === 'b')?.count).toBe(0);
  });

  it('absolutní count přidá záznam pro nový kanál', () => {
    const out = applyUnreadEvent(seed, { channelId: 'c', mentionCount: 0, count:3 });
    expect(out.find((u) => u.channelId === 'c')?.count).toBe(3);
    expect(out).toHaveLength(3);
  });

  it('sentinel -1 inkrementuje existující count o 1', () => {
    const out = applyUnreadEvent(seed, { channelId: 'a', mentionCount: 0, count:-1 });
    expect(out.find((u) => u.channelId === 'a')?.count).toBe(3);
  });

  it('sentinel -1 pro neznámý kanál → count 1 (0 + 1)', () => {
    const out = applyUnreadEvent(seed, { channelId: 'new', mentionCount: 0, count:-1 });
    expect(out.find((u) => u.channelId === 'new')?.count).toBe(1);
  });

  it('aktivní konverzace vždy drží count 0 — i pro sentinel', () => {
    const out = applyUnreadEvent(
      seed,
      { channelId: 'a', mentionCount: 0, count:-1 },
      'a',
    );
    expect(out.find((u) => u.channelId === 'a')?.count).toBe(0);
  });

  it('aktivní konverzace vždy drží count 0 — i pro absolutní > 0', () => {
    const out = applyUnreadEvent(
      seed,
      { channelId: 'a', mentionCount: 0, count:42 },
      'a',
    );
    expect(out.find((u) => u.channelId === 'a')?.count).toBe(0);
  });

  it('jiný než aktivní kanál se chová normálně', () => {
    const out = applyUnreadEvent(
      seed,
      { channelId: 'b', mentionCount: 0, count:-1 },
      'a',
    );
    expect(out.find((u) => u.channelId === 'b')?.count).toBe(1);
  });

  it('je čistá funkce — nemění vstupní seznam', () => {
    const before = JSON.stringify(seed);
    applyUnreadEvent(seed, { channelId: 'a', mentionCount: 0, count:-1 });
    expect(JSON.stringify(seed)).toBe(before);
  });
});
