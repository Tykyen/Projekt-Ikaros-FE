import { WorldRole, type WorldMembership } from '@/shared/types';

/**
 * Člen se počítá jako „hráč" světa = aktivně hraje (má přiřazenou postavu
 * `characterPath`) NEBO je staff (role >= Korektor: Korektor, PomocnyPJ, PJ,
 * kteří svět vedou/spravují i bez postavy). Žadatel se nepočítá nikdy — i
 * kdyby měl omylem přiřazenou postavu.
 *
 * Nepočítají se: žadatel, čtenář a hráč BEZ přiřazené postavy. Ti můžou ve
 * světě existovat (čtenář/žadatel), ale do počtu „Hráči" ani do adresáře
 * `/hraci` nepatří.
 *
 * ⚠️ POZOR — liší se od `isPlayingMember` (groupMembers.ts): tam se staff bez
 * postavy NEpočítá (stránka skupiny zobrazuje jen postavy). Tady se staff
 * počítá. Dva různé predikáty pro dva různé účely — nezaměňovat.
 */
export function isWorldPlayer(m: WorldMembership): boolean {
  if (m.role === WorldRole.Zadatel) return false;
  return !!m.characterPath || m.role >= WorldRole.Korektor;
}
