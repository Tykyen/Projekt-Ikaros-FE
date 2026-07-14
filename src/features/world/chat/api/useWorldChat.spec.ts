import { describe, it, expect, vi } from 'vitest';
import {
  applyUnreadEvent,
  prependOlderMessages,
  huntMessageInHistory,
} from './useWorldChat';
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

describe('huntMessageInHistory (spec-chat-search-jump)', () => {
  /** Cache simulovaná plochým polem + prepend přes produkční reducer. */
  function makeCache(seed: ChatMessage[]) {
    let cache = seed;
    return {
      deps: {
        getMessages: () => cache,
        prepend: (older: ChatMessage[]) => {
          cache = prependOlderMessages(cache, older);
        },
      },
      read: () => cache,
    };
  }

  it('najde cíl v první dávce → found, dávka je v cache', async () => {
    const cache = makeCache([msg('m10')]);
    const fetchOlder = vi.fn().mockResolvedValue([msg('target'), msg('m9')]);
    const result = await huntMessageInHistory({
      targetId: 'target',
      fetchOlder,
      ...cache.deps,
      isCancelled: () => false,
      batchLimit: 2,
    });
    expect(result).toBe('found');
    expect(cache.read().map((m) => m.id)).toEqual(['target', 'm9', 'm10']);
  });

  it('projde víc dávek — kurzor jede od nejstarší načtené', async () => {
    const cache = makeCache([msg('m10')]);
    const fetchOlder = vi
      .fn()
      .mockResolvedValueOnce([msg('m8'), msg('m9')])
      .mockResolvedValueOnce([msg('target'), msg('m7')]);
    const result = await huntMessageInHistory({
      targetId: 'target',
      fetchOlder,
      ...cache.deps,
      isCancelled: () => false,
      batchLimit: 2,
    });
    expect(result).toBe('found');
    expect(fetchOlder).toHaveBeenNthCalledWith(1, 'm10');
    expect(fetchOlder).toHaveBeenNthCalledWith(2, 'm8');
  });

  it('krátká dávka bez cíle = začátek historie → reachedStart', async () => {
    const cache = makeCache([msg('m10')]);
    const fetchOlder = vi.fn().mockResolvedValue([msg('m9')]); // 1 < limit 2
    const result = await huntMessageInHistory({
      targetId: 'target',
      fetchOlder,
      ...cache.deps,
      isCancelled: () => false,
      batchLimit: 2,
    });
    expect(result).toBe('reachedStart');
  });

  it('pojistka maxBatches → exhausted (nezacyklí se)', async () => {
    let n = 0;
    const cache = makeCache([msg('m0')]);
    const fetchOlder = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve([msg(`a${++n}`), msg(`b${n}`)]),
      );
    const result = await huntMessageInHistory({
      targetId: 'target',
      fetchOlder,
      ...cache.deps,
      isCancelled: () => false,
      batchLimit: 2,
      maxBatches: 3,
    });
    expect(result).toBe('exhausted');
    expect(fetchOlder).toHaveBeenCalledTimes(3);
  });

  it('zrušení (přepnutí konverzace) → cancelled, dávka se nezapíše', async () => {
    const cache = makeCache([msg('m10')]);
    let cancelled = false;
    const fetchOlder = vi.fn().mockImplementation(() => {
      cancelled = true; // zrušeno během fetche
      return Promise.resolve([msg('target'), msg('m9')]);
    });
    const result = await huntMessageInHistory({
      targetId: 'target',
      fetchOlder,
      ...cache.deps,
      isCancelled: () => cancelled,
      batchLimit: 2,
    });
    expect(result).toBe('cancelled');
    expect(cache.read().map((m) => m.id)).toEqual(['m10']);
  });

  it('síťová chyba → exhausted (bez výjimky ven)', async () => {
    const cache = makeCache([msg('m10')]);
    const fetchOlder = vi.fn().mockRejectedValue(new Error('network'));
    const result = await huntMessageInHistory({
      targetId: 'target',
      fetchOlder,
      ...cache.deps,
      isCancelled: () => false,
      batchLimit: 2,
    });
    expect(result).toBe('exhausted');
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
