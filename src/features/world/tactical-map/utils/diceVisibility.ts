import type { MapDiceRoll } from '../types';
import type { WorldDiceVisibility } from '@/shared/types';

const DEFAULT_VIS: WorldDiceVisibility = {
  showPjRolls: false,
  showNpcBestieRolls: false,
  showTeammateRolls: true,
};

export interface DiceViewer {
  userId: string;
  isPj: boolean;
}

/** Smí `viewer` vidět tento hod? Řídí overlay na ploše i log. */
export function canSeeRoll(
  roll: MapDiceRoll,
  viewer: DiceViewer,
  visibility: WorldDiceVisibility | undefined,
): boolean {
  if (viewer.isPj) return true;
  if (roll.byUserId === viewer.userId) return true; // vlastní vždy
  const vis = visibility ?? DEFAULT_VIS;
  switch (roll.rollerKind) {
    case 'pj':
      return vis.showPjRolls;
    case 'npc':
    case 'bestie':
      return vis.showNpcBestieRolls;
    case 'pc':
      return vis.showTeammateRolls;
    default:
      return false;
  }
}
