import { WorldRole } from '@/shared/types';
import type { WorldRoleKey } from '@/shared/ui';

/** Český název světové role. */
export const ROLE_LABEL: Record<WorldRole, string> = {
  [WorldRole.Zadatel]: 'Žadatel',
  [WorldRole.Ctenar]: 'Čtenář',
  [WorldRole.Hrac]: 'Hráč',
  [WorldRole.Korektor]: 'Korektor',
  [WorldRole.PomocnyPJ]: 'Pomocný PJ',
  [WorldRole.PJ]: 'PJ',
};

/** Mapování číselné role na ikonový klíč `WorldRoleIcon`. */
export const ROLE_ICON_KEY: Record<WorldRole, WorldRoleKey> = {
  [WorldRole.Zadatel]: 'applicant',
  [WorldRole.Ctenar]: 'reader',
  [WorldRole.Hrac]: 'player',
  [WorldRole.Korektor]: 'corrector',
  [WorldRole.PomocnyPJ]: 'pj-asst',
  [WorldRole.PJ]: 'pj',
};

/** Všechny role vzestupně — pro nabídku v selectu. */
export const ALL_ROLES: WorldRole[] = [
  WorldRole.Zadatel,
  WorldRole.Ctenar,
  WorldRole.Hrac,
  WorldRole.Korektor,
  WorldRole.PomocnyPJ,
  WorldRole.PJ,
];
