import { describe, it, expect } from 'vitest';
import { canSeeRoll } from './diceVisibility';
import type { MapDiceRoll } from '../types';
import type { WorldDiceVisibility } from '@/shared/types';

const mk = (kind: MapDiceRoll['rollerKind'], by: string): MapDiceRoll => ({
  id: 'r', rolledAt: '', byUserId: by, rollerName: 'X',
  rollerKind: kind, category: 'custom',
  dicePayload: { type: 'd20', faces: [1], sum: 1, total: 1 } as never,
});
const VIS: WorldDiceVisibility = { showPjRolls: false, showNpcBestieRolls: false, showTeammateRolls: true };

it('PJ vidí vše', () => {
  expect(canSeeRoll(mk('pj', 'gm'), { userId: 'me', isPj: true }, VIS)).toBe(true);
  expect(canSeeRoll(mk('npc', 'gm'), { userId: 'me', isPj: true }, VIS)).toBe(true);
});
it('vlastní hod vždy', () => {
  expect(canSeeRoll(mk('pc', 'me'), { userId: 'me', isPj: false }, VIS)).toBe(true);
});
it('PJ hody skryté default', () => {
  expect(canSeeRoll(mk('pj', 'gm'), { userId: 'me', isPj: false }, VIS)).toBe(false);
});
it('NPC/bestie hody skryté default', () => {
  expect(canSeeRoll(mk('npc', 'gm'), { userId: 'me', isPj: false }, VIS)).toBe(false);
  expect(canSeeRoll(mk('bestie', 'gm'), { userId: 'me', isPj: false }, VIS)).toBe(false);
});
it('spoluhráči viditelní default', () => {
  expect(canSeeRoll(mk('pc', 'other'), { userId: 'me', isPj: false }, VIS)).toBe(true);
});
it('undefined visibility = výchozí (jen vlastní + spoluhráči)', () => {
  expect(canSeeRoll(mk('pj', 'gm'), { userId: 'me', isPj: false }, undefined)).toBe(false);
  expect(canSeeRoll(mk('pc', 'other'), { userId: 'me', isPj: false }, undefined)).toBe(true);
});
