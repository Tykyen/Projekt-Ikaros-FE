/**
 * 9.4 dluh #4 — testy useFavorites hooku.
 *
 * Pokryté scénáře:
 *  - Initial state je prázdný pro nový userId × worldId.
 *  - Toggle přidá / odebere ID.
 *  - Persistuje napříč re-renderem (mock localStorage).
 *  - Per-world izolace (jiný worldId vidí jiný seznam).
 *  - Per-user izolace (jiný userId vidí jiný seznam).
 *  - Clear vyprázdní seznam.
 *  - MAX 20 limit — 21. položka nepřibyde.
 *  - Null userId / prázdný worldId → no-op (žádný localStorage write).
 *  - Corrupted JSON v localStorage → empty array, žádný throw.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useFavorites, __resetFavoritesCache } from './useFavorites';

beforeEach(() => {
  window.localStorage.clear();
  __resetFavoritesCache();
});

describe('useFavorites', () => {
  it('initial state je prázdný array pro nový userId × worldId', () => {
    const { result } = renderHook(() => useFavorites('u1', 'w1'));
    expect(result.current.favorites).toEqual([]);
    expect(result.current.isFavorite('g1')).toBe(false);
  });

  it('toggle přidá ID a podruhé ho odebere', () => {
    const { result } = renderHook(() => useFavorites('u1', 'w1'));

    act(() => result.current.toggle('g1'));
    expect(result.current.favorites).toEqual(['g1']);
    expect(result.current.isFavorite('g1')).toBe(true);

    act(() => result.current.toggle('g1'));
    expect(result.current.favorites).toEqual([]);
    expect(result.current.isFavorite('g1')).toBe(false);
  });

  it('persistuje napříč re-renderem (nová instance hooku načte stejná data)', () => {
    const { result: a } = renderHook(() => useFavorites('u1', 'w1'));
    act(() => a.current.toggle('g1'));
    act(() => a.current.toggle('g2'));

    const { result: b } = renderHook(() => useFavorites('u1', 'w1'));
    expect(b.current.favorites).toEqual(['g1', 'g2']);
  });

  it('per-world izolace — userA × worldA vs. userA × worldB jsou samostatné', () => {
    const { result: world1 } = renderHook(() => useFavorites('u1', 'w1'));
    const { result: world2 } = renderHook(() => useFavorites('u1', 'w2'));

    act(() => world1.current.toggle('g1'));
    expect(world1.current.favorites).toEqual(['g1']);
    expect(world2.current.favorites).toEqual([]);
  });

  it('per-user izolace — userA × world vs. userB × world jsou samostatné', () => {
    const { result: ua } = renderHook(() => useFavorites('u1', 'w1'));
    const { result: ub } = renderHook(() => useFavorites('u2', 'w1'));

    act(() => ua.current.toggle('g1'));
    expect(ua.current.favorites).toEqual(['g1']);
    expect(ub.current.favorites).toEqual([]);
  });

  it('clear vyprázdní seznam', () => {
    const { result } = renderHook(() => useFavorites('u1', 'w1'));
    act(() => result.current.toggle('g1'));
    act(() => result.current.toggle('g2'));
    expect(result.current.favorites).toHaveLength(2);

    act(() => result.current.clear());
    expect(result.current.favorites).toEqual([]);
  });

  it('respektuje MAX 20 favorites limit', () => {
    const { result } = renderHook(() => useFavorites('u1', 'w1'));
    act(() => {
      for (let i = 0; i < 25; i++) result.current.toggle(`g${i}`);
    });
    // Posledních 5 (g20..g24) by mělo být oříznuto — drží prvních 20.
    expect(result.current.favorites).toHaveLength(20);
    expect(result.current.isFavorite('g0')).toBe(true);
    expect(result.current.isFavorite('g19')).toBe(true);
    expect(result.current.isFavorite('g20')).toBe(false);
  });

  it('null userId → no-op, toggle nic nezapíše', () => {
    const { result } = renderHook(() => useFavorites(null, 'w1'));
    act(() => result.current.toggle('g1'));
    expect(result.current.favorites).toEqual([]);
    // Žádný klíč v localStorage nevznikne.
    expect(window.localStorage.length).toBe(0);
  });

  it('corrupted JSON v localStorage → empty array, žádný throw', () => {
    window.localStorage.setItem('weather-favorites:u1:w1', '{not json');
    const { result } = renderHook(() => useFavorites('u1', 'w1'));
    expect(result.current.favorites).toEqual([]);
  });
});
