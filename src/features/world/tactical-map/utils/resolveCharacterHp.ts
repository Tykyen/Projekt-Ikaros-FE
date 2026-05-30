/**
 * 10.2g — HP postavy (PC/NPC) pro HP bar na taktické mapě.
 *
 * Bestie nesou HP ve `systemStats` (snapshot při spawnu) → řeší `resolveHp`.
 * PC/NPC token má `currentHp/maxHp = 0` a HP žije v diary subdocu postavy
 * (`CharacterDiary.customData`), per-system pod jiným klíčem. Tento util
 * mapuje systemId → klíče HP. Data jsou na tokenu z BE enrichu
 * (`token.characterData.customData`), takže není potřeba extra fetch.
 *
 * Systémy bez klasického HP (fate = stres, drd2 = 3 zdroje, drdplus = tracker
 * zranění) vrací `null` — jejich „zdraví" není HP a mapování na bar je herní
 * rozhodnutí, ne technické. Doplní se cíleně, až padne rozhodnutí.
 *
 * Klíče ověřeny proti combat panelům daných systémů (system-panels/*).
 */

export interface CharacterHp {
  current: number;
  max: number;
}

/** Bezpečné přečtení čísla z customData (hodnoty bývají uložené jako string). */
function readNum(
  cd: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const raw = cd[key];
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const parsed = parseInt(String(raw ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Vyřeší HP postavy dle systému z diary `customData` (BE enrich dodává jako
 * `token.characterData.customData`). `null` = systém nemá klasické HP, nebo
 * postava nemá vyplněné max HP (→ bar se nezobrazí).
 */
export function resolveCharacterHp(
  systemId: string | null,
  customData: Record<string, unknown> | undefined,
): CharacterHp | null {
  if (!systemId || !customData) return null;
  const cd = customData;

  switch (systemId) {
    case 'matrix': {
      // Max je v matrixu konstanta 5 (MatrixCombatPanel max={5}).
      const current = readNum(cd, 'matrix_health', 5);
      return { current, max: 5 };
    }
    case 'dnd5e': {
      const max = readNum(cd, 'dnd_maxHP', 0);
      if (max <= 0) return null;
      return { current: readNum(cd, 'dnd_currentHP', max), max };
    }
    case 'coc': {
      const max = readNum(cd, 'coc_hp_max', 0);
      if (max <= 0) return null;
      return { current: readNum(cd, 'coc_hp_cur', max), max };
    }
    case 'gurps': {
      const max = readNum(cd, 'gurps_hp_max', 0);
      if (max <= 0) return null;
      return { current: readNum(cd, 'gurps_hp', max), max };
    }
    case 'drdh': {
      const max = readNum(cd, 'drdh_hp_max', 0);
      if (max <= 0) return null;
      return { current: readNum(cd, 'drdh_hp', max), max };
    }
    case 'drd16': {
      // drd16 ukládá HP bez prefixu (legacy klíče).
      const max = readNum(cd, 'hp_max', 0);
      if (max <= 0) return null;
      return { current: readNum(cd, 'hp_current', max), max };
    }
    // fate / drd2 / drdplus — bez klasického HP, mapování je herní rozhodnutí.
    default:
      return null;
  }
}
