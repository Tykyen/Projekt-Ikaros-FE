import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mutate = vi.fn();
vi.mock('../../api/useWorldChat', () => ({
  useSendMessage: () => ({ mutate }),
}));
vi.mock('../../dice/components/DiceRollOverlayProvider', () => ({
  // trigger zavolá onComplete hned → send se provede synchronně.
  useDiceRollOverlay: () => ({
    trigger: (_p: unknown, _s: unknown, _r: unknown, cb?: () => void) => cb?.(),
  }),
}));
vi.mock('../../dice/api/useDiceSkinMapping', () => ({
  useDiceSkinMapping: () => ({ getSkin: () => 'core-obsidian' }),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { useChatDiaryRoll } from './useChatDiaryRoll';

describe('useChatDiaryRoll — atribuce (16.1a)', () => {
  beforeEach(() => mutate.mockClear());

  it('self: hod bez override (jeho persona)', () => {
    const { result } = renderHook(() => useChatDiaryRoll('w1', 'c1'));
    result.current({ kind: 'self', rollerName: 'Aria' })({
      label: 'Útok',
      modifier: 2,
    });
    expect(mutate).toHaveBeenCalledTimes(1);
    const payload = mutate.mock.calls[0][0];
    expect(payload.dicePayload).toBeTruthy();
    expect(payload.content).toContain('Útok');
    expect(payload.diceSkin).toBe('core-obsidian');
    expect(payload.overrideName).toBeUndefined();
  });

  it('pj: bez override (render-time „PJ")', () => {
    const { result } = renderHook(() => useChatDiaryRoll('w1', 'c1'));
    result.current({ kind: 'pj', rollerName: 'PJ' })({ label: 'X' });
    expect(mutate.mock.calls[0][0].overrideName).toBeUndefined();
  });

  it('npc: override jméno + avatar + slug', () => {
    const { result } = renderHook(() => useChatDiaryRoll('w1', 'c1'));
    result.current({
      kind: 'npc',
      rollerName: 'Duch',
      avatarUrl: 'http://x/a.png',
      slug: 'duch',
    })({ label: 'Ledový dotek', modifier: 4 });
    const payload = mutate.mock.calls[0][0];
    expect(payload.overrideName).toBe('Duch');
    expect(payload.overrideAvatarUrl).toBe('http://x/a.png');
    expect(payload.overridePageSlug).toBe('duch');
  });

  it('bez channelId: nic nepošle', () => {
    const { result } = renderHook(() => useChatDiaryRoll('w1', null));
    result.current({ kind: 'self', rollerName: 'Aria' })({ label: 'X' });
    expect(mutate).not.toHaveBeenCalled();
  });
});
