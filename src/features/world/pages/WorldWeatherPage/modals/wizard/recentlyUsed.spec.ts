/**
 * 9.4-I — Unit testy pro localStorage Recently Used presety.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getRecentPresetIds,
  pushRecentPresetId,
} from './recentlyUsed';

const USER_ID = 'user-1';
const WORLD_ID = 'world-1';

beforeEach(() => {
  window.localStorage.clear();
});

describe('recentlyUsed', () => {
  it('vrátí prázdné pole když není uloženo', () => {
    expect(getRecentPresetIds(USER_ID, WORLD_ID)).toEqual([]);
  });

  it('uloží a načte preset ID', () => {
    pushRecentPresetId(USER_ID, WORLD_ID, 'praha');
    expect(getRecentPresetIds(USER_ID, WORLD_ID)).toEqual(['praha']);
  });

  it('nejnovější preset je first', () => {
    pushRecentPresetId(USER_ID, WORLD_ID, 'praha');
    pushRecentPresetId(USER_ID, WORLD_ID, 'mars');
    pushRecentPresetId(USER_ID, WORLD_ID, 'vostok');
    expect(getRecentPresetIds(USER_ID, WORLD_ID)).toEqual([
      'vostok',
      'mars',
      'praha',
    ]);
  });

  it('limit max 3 položky (FIFO drop oldest)', () => {
    ['a', 'b', 'c', 'd', 'e'].forEach((id) =>
      pushRecentPresetId(USER_ID, WORLD_ID, id),
    );
    expect(getRecentPresetIds(USER_ID, WORLD_ID)).toEqual(['e', 'd', 'c']);
  });

  it('duplicitní push → posune existing nahoru, nezduplikuje', () => {
    pushRecentPresetId(USER_ID, WORLD_ID, 'praha');
    pushRecentPresetId(USER_ID, WORLD_ID, 'mars');
    pushRecentPresetId(USER_ID, WORLD_ID, 'praha');
    expect(getRecentPresetIds(USER_ID, WORLD_ID)).toEqual(['praha', 'mars']);
  });

  it('per-user, per-world isolation', () => {
    pushRecentPresetId('user-1', 'world-1', 'praha');
    pushRecentPresetId('user-2', 'world-1', 'mars');
    pushRecentPresetId('user-1', 'world-2', 'vostok');
    expect(getRecentPresetIds('user-1', 'world-1')).toEqual(['praha']);
    expect(getRecentPresetIds('user-2', 'world-1')).toEqual(['mars']);
    expect(getRecentPresetIds('user-1', 'world-2')).toEqual(['vostok']);
  });

  it('chybějící userId/worldId → no-op', () => {
    pushRecentPresetId(null, WORLD_ID, 'praha');
    pushRecentPresetId(USER_ID, '', 'praha');
    expect(getRecentPresetIds(null, WORLD_ID)).toEqual([]);
    expect(getRecentPresetIds(USER_ID, '')).toEqual([]);
  });
});
