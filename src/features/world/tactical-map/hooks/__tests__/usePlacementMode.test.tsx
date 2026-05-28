/**
 * 10.2c-edit-9a — placement mode state machine test.
 */
import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePlacementMode } from '../usePlacementMode';
import type { SpawnPayload } from '../../utils/spawnPayload';

const PC: SpawnPayload = {
  kind: 'pc',
  characterId: 'c1',
  characterSlug: 'jan',
  name: 'Jan',
};

const BESTIE: SpawnPayload = {
  kind: 'bestie',
  bestieId: 'b1',
  name: 'Skřet',
};

describe('usePlacementMode', () => {
  it('default: inactive', () => {
    const { result } = renderHook(() => usePlacementMode());
    expect(result.current.state).toEqual({ active: false });
  });

  it('start → active s payload + multi flag', () => {
    const { result } = renderHook(() => usePlacementMode());
    act(() => result.current.start(PC, false));
    expect(result.current.state).toEqual({
      active: true,
      payload: PC,
      multi: false,
    });
  });

  it('consume v single mode → inactive', () => {
    const { result } = renderHook(() => usePlacementMode());
    act(() => result.current.start(PC, false));
    act(() => result.current.consume());
    expect(result.current.state).toEqual({ active: false });
  });

  it('consume v multi mode → zůstává aktivní se stejným payloadem', () => {
    const { result } = renderHook(() => usePlacementMode());
    act(() => result.current.start(BESTIE, true));
    act(() => result.current.consume());
    act(() => result.current.consume());
    expect(result.current.state).toEqual({
      active: true,
      payload: BESTIE,
      multi: true,
    });
  });

  it('cancel z multi mode → inactive', () => {
    const { result } = renderHook(() => usePlacementMode());
    act(() => result.current.start(BESTIE, true));
    act(() => result.current.cancel());
    expect(result.current.state).toEqual({ active: false });
  });

  it('ESC keydown → cancel', () => {
    const { result } = renderHook(() => usePlacementMode());
    act(() => result.current.start(PC, false));
    expect(result.current.state.active).toBe(true);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(result.current.state).toEqual({ active: false });
  });

  it('ESC neudělá nic pokud placement neaktivní (listener se neregistruje)', () => {
    const { result } = renderHook(() => usePlacementMode());
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(result.current.state).toEqual({ active: false });
  });

  it('jiná klávesa neudělá nic', () => {
    const { result } = renderHook(() => usePlacementMode());
    act(() => result.current.start(PC, false));
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });
    expect(result.current.state.active).toBe(true);
  });

  it('restart s jiným payloadem během aktivního módu', () => {
    const { result } = renderHook(() => usePlacementMode());
    act(() => result.current.start(PC, false));
    act(() => result.current.start(BESTIE, true));
    expect(result.current.state).toEqual({
      active: true,
      payload: BESTIE,
      multi: true,
    });
  });
});
