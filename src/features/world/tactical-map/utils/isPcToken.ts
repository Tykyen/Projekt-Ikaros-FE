/**
 * 10.2f — PC token = postava hráče (ne NPC, ne bestie).
 *
 * PC jsou v boji vždy (nelze je vyřadit) — v iniciativní liště jsou trvale
 * v sekci „v boji", bez toggle. NPC/bestie zařazuje PJ ručně přes `inCombat`.
 */
import type { MapToken } from '../types';
import { tokenIsBestie } from './tokenIsBestie';

export function isPcToken(t: MapToken): boolean {
  return !t.isNpc && !tokenIsBestie(t);
}
