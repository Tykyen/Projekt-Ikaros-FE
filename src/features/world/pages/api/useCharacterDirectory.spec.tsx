import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import {
  useCharacterDirectory,
  pageEntryToCharacterDirectoryEntry,
} from './useCharacterDirectory';
import { charactersQueryKey } from './characters.types';
import type { PageDirectoryEntry } from './pages.types';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({ api: { get: vi.fn() } }));

function makeWrapperWithQc() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { wrapper, qc };
}

function pageEntry(over: Partial<PageDirectoryEntry> = {}): PageDirectoryEntry {
  return {
    id: 'page-1',
    slug: 'aragorn',
    title: 'Aragorn',
    type: 'Postava hráče',
    order: 0,
    updatedAt: '2026-07-13T00:00:00.000Z',
    imageUrl: 'http://example.test/a.png',
    imageFocalX: 10,
    imageFocalY: 20,
    imageZoom: 120,
    imageFit: 'contain',
    ownerUserId: 'user-1',
    characterId: 'char-1',
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// D-DATA-SYNC-ZBYTKY a — adapter Pages directory → legacy CharacterDirectoryEntry.
describe('pageEntryToCharacterDirectoryEntry', () => {
  it('past directory_id — id = CHARACTER ID (ne page ID), name = title, userId = ownerUserId', () => {
    const e = pageEntryToCharacterDirectoryEntry(pageEntry());
    // Finance selecty (SettingsAccountSection) posílají `id` do BE jako
    // characterId — page ID by korumpoval accessLocation/spoluvlastníky.
    expect(e.id).toBe('char-1');
    expect(e.slug).toBe('aragorn');
    expect(e.name).toBe('Aragorn');
    expect(e.isNpc).toBe(false);
    expect(e.kind).toBe('persona');
    // ownerUserId oživuje MapEmptyState „Tvé postavy" (legacy userId nevracel).
    expect(e.userId).toBe('user-1');
    // Výřez avataru (parita s GameEvent) projde beze změny.
    expect(e.imageUrl).toBe('http://example.test/a.png');
    expect(e.imageFocalX).toBe(10);
    expect(e.imageFocalY).toBe(20);
    expect(e.imageZoom).toBe(120);
    expect(e.imageFit).toBe('contain');
  });

  it('type NPC → isNpc=true, kind=persona', () => {
    const e = pageEntryToCharacterDirectoryEntry(
      pageEntry({ type: 'NPC', ownerUserId: undefined }),
    );
    expect(e.isNpc).toBe(true);
    expect(e.kind).toBe('persona');
    expect(e.userId).toBeUndefined();
  });

  it('type Lokace → kind=location, isNpc=false (filter „postava hráče" ji vyřadí)', () => {
    const e = pageEntryToCharacterDirectoryEntry(pageEntry({ type: 'Lokace' }));
    expect(e.kind).toBe('location');
    expect(e.isNpc).toBe(false);
  });

  it('fallback — bez characterId (stale BE) spadne id na page ID', () => {
    expect(
      pageEntryToCharacterDirectoryEntry(pageEntry({ characterId: null })).id,
    ).toBe('page-1');
    expect(
      pageEntryToCharacterDirectoryEntry(pageEntry({ characterId: undefined }))
        .id,
    ).toBe('page-1');
  });
});

describe('useCharacterDirectory (adapter nad Pages directory)', () => {
  it('volá pages directory s type filtrem PC+NPC+Lokace a mapuje entries', async () => {
    vi.mocked(api.get).mockResolvedValue([
      pageEntry(),
      pageEntry({
        id: 'page-2',
        slug: 'goblin',
        title: 'Goblin',
        type: 'NPC',
        characterId: 'char-2',
        ownerUserId: undefined,
      }),
    ] as never);
    const { wrapper } = makeWrapperWithQc();
    const { result } = renderHook(() => useCharacterDirectory('w1'), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = vi.mocked(api.get).mock.calls[0][0] as string;
    expect(url).toContain('/worlds/w1/pages/directory?type=');
    // Parita s legacy: PC (encoded diakritika) + NPC + Lokace.
    expect(url).toContain(encodeURIComponent('Postava hráče'));
    expect(url).toContain('NPC');
    expect(url).toContain('Lokace');
    // Legacy characters endpoint se už NEvolá.
    expect(url).not.toContain('/characters/directory');

    expect(result.current.data).toEqual([
      expect.objectContaining({ id: 'char-1', name: 'Aragorn', isNpc: false }),
      expect.objectContaining({ id: 'char-2', name: 'Goblin', isNpc: true }),
    ]);
  });

  it('drift-safe queryKey — data leží pod charactersQueryKey.directory (C-15 invalidace)', async () => {
    vi.mocked(api.get).mockResolvedValue([pageEntry()] as never);
    const { wrapper, qc } = makeWrapperWithQc();
    const { result } = renderHook(() => useCharacterDirectory('w1'), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // useCreatePage/useUpdatePage/useDeletePage + useCharacterMutations
    // invalidují tenhle klíč — adapter na něm MUSÍ zůstat.
    expect(qc.getQueryData(charactersQueryKey.directory('w1'))).toEqual(
      result.current.data,
    );
  });

  it('bez worldId se nefetchuje (enabled gate)', () => {
    const { wrapper } = makeWrapperWithQc();
    renderHook(() => useCharacterDirectory(''), { wrapper });
    expect(api.get).not.toHaveBeenCalled();
  });
});
