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
    case 'pi': {
      // Příběhy Impéria — Životy konstanta 5 (PiCombatPanel max={5}), klíč pi_health.
      const current = readNum(cd, 'pi_health', 5);
      return { current, max: 5 };
    }
    case 'jad': {
      // JaD deník ukládá s prefixem `jad_` (makeCdAccess). Fallback na legacy
      // bez prefixu pro starší data.
      const max = readNum(cd, 'jad_hpMax', readNum(cd, 'hpMax', 0));
      if (max <= 0) return null;
      return {
        current: readNum(cd, 'jad_hpCur', readNum(cd, 'hpCur', max)),
        max,
      };
    }
    case 'dnd5e': {
      // DnD5e deník ukládá s prefixem `dnd_` (makeCdAccess `dnd_hpMax/hpCur`).
      // Fallback na legacy bez prefixu pro starší data.
      const max = readNum(cd, 'dnd_hpMax', readNum(cd, 'hpMax', 0));
      if (max <= 0) return null;
      return {
        current: readNum(cd, 'dnd_hpCur', readNum(cd, 'hpCur', max)),
        max,
      };
    }
    case 'coc': {
      const max = readNum(cd, 'coc_hp_max', 0);
      if (max <= 0) return null;
      return { current: readNum(cd, 'coc_hp_cur', max), max };
    }
    case 'gurps': {
      // HP se v GURPS 4E odvozuje od ST; deník auto-default (hpMax = ST) do
      // customData NEukládá → fallback na gurps_st, ať se bar ukáže i bez
      // explicitně vyplněného gurps_hp_max (jinak čerstvá postava = žádný bar).
      const max = readNum(cd, 'gurps_hp_max', readNum(cd, 'gurps_st', 0));
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
    case 'shadowrun': {
      // SR6 HP bar = FYZICKÝ záznamník: max = 8 + ⌈Tělo/2⌉, zbývá = max − zranění
      // (`sr_cond_phys` = počet zaplněných boxů). Omračovací track je zvlášť (ne na baru).
      const bod = readNum(cd, 'sr_attr_bod', 0);
      const max = 8 + Math.ceil(bod / 2);
      const filled = readNum(cd, 'sr_cond_phys', 0);
      return { current: Math.max(0, max - filled), max };
    }
    case 'fae':
    case 'fate': {
      // Fate: „zdraví" = stres boxy (absorpční kapacita), ne HP. Bar = zbývající
      // (nezaškrtnuté) boxy / celkem — konzistentní s bestií („zbývající kapacita").
      const raw = cd[`${systemId}_stress`];
      let boxes: { on?: boolean }[] = [];
      if (Array.isArray(raw)) {
        boxes = raw as { on?: boolean }[];
      } else if (typeof raw === 'string' && raw) {
        try {
          const p: unknown = JSON.parse(raw);
          if (Array.isArray(p)) boxes = p as { on?: boolean }[];
        } catch {
          /* nevalidní JSON → default níže */
        }
      }
      const max = boxes.length || 3; // default 3 stres boxy (DEFAULT_BOXES panelu)
      const filled = boxes.filter((b) => b && b.on).length;
      return { current: Math.max(0, max - filled), max };
    }
    case 'drdplus': {
      // DrD+: „zdraví" = mez zranění (práh 1. pásma „Bez postihu"). Bar = zbývající
      // do postihu (mez − zaplněné rány). Hlubší pásma (postih/koma) → bar 0.
      const max = readNum(cd, 'drdp_zraneni_mez', 10);
      if (max <= 0) return null;
      const val = readNum(cd, 'drdp_zraneni_val', 0);
      return { current: Math.max(0, max - val), max };
    }
    // drd2 — 3 zdroje (Tělo/Duše/Vliv), ne jedno HP; navíc HP_BAR_DISABLED_SYSTEMS.
    default:
      return null;
  }
}
