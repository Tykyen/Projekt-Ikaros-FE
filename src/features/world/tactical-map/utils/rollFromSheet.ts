/**
 * 10.2c-edit-9g (Fáze C+D) — roll utility pro per-system sheets v token panelu.
 *
 * Konzument: MatrixSheet, Drd2Sheet, FateSheet, ... — klik na dovednost
 * / iniciativu volá tento helper s `{label, modifier, kind}`. Roll použije
 * existing `chat/dice/lib/rollEngine` (Fate / generic) a výsledek zobrazí
 * jako toast (sonner). Plný chat send vyžaduje channelId context — defer
 * Fáze D2 (až vyřeším který channel posílat — currently active scéna /
 * world default).
 *
 * Format zpráv mirror Matrix old `formatFateMessage`.
 */
import { toast } from "sonner";
import {
  rollFate,
  rollGenericDice,
  rollMixedDice,
  rollPoolHits,
  type RollKind,
} from "@/features/world/chat/dice/lib/rollEngine";
import {
  buildFatePayload,
  buildGenericPayload,
  buildMixedPayload,
  buildPoolHitsPayload,
  type DicePayload,
} from "@/features/world/chat/dice/lib/dicePayload";

export interface RollRequest {
  /** Lidský label (jméno dovednosti / „Iniciativa"). */
  label: string;
  /** Modifikátor přidaný k roll sumu (např. skill level). Default 0. */
  modifier?: number;
  /**
   * Typ kostky. `fate` = 4dF (Matrix / Fate). `d20` / `d6` / ... pro
   * generic systémy. `mixed` = skládaný hod různých kostek (JaD zásah) — počty
   * v `mixed`. Pro nestandartní pool kostky volej rollEngine přímo.
   */
  kind?: RollKind;
  /**
   * JaD (8.7q): u `kind:'d20'` zapni detekci fatálního úspěchu/neúspěchu
   * (přirozená 20 / 1 na jediné kostce). Jen JaD — ostatní d20 systémy bez flagu.
   */
  critOnD20?: boolean;
  /**
   * JaD (8.7q) skládaný hod zásahu (`kind:'mixed'`): počty kostek dle typu,
   * např. `{ d10: 2, d6: 2, d4: 2 }` pro `2k10+2k6+2k4`. `modifier` = `+číslo`.
   */
  mixed?: Record<string, number>;
  /**
   * Kdo rolluje. 10.2j — už se nepoužívá (toast zrušen, jméno v logu řeší
   * `useMapDiceRoll` z vieweru). Ponecháno kvůli zpětné kompatibilitě volajících.
   */
  rollerName?: string;
  /**
   * Shadowrun (a jiné success-pool systémy): počet kostek **poolu**. Když je
   * zadán a `kind` je `pool-d6` (nebo jiné `pool-dN`), hodí se pool a počítají
   * se **úspěchy** (5–6) + glitch místo součtu. `modifier` se pro pool nepoužívá
   * (pool už zahrnuje atribut+dovednost−postih z volajícího).
   */
  pool?: number;
  /**
   * 16b (DrdH) — rozepsané složky modifieru (`útoč +6`, `Sil −1`) pro rozpis
   * hodu v dicelog/readout. Jen se předá dál do `dicePayload`, výpočet
   * neovlivní. Volitelné → ostatní systémy beze změny.
   */
  breakdown?: { label: string; value: number }[];
  /**
   * 16b (DrdH) — zranění útoku se znaménkem (`'+1'`/`'−1'`) k zobrazení za
   * výsledkem. Jen se předá dál do `dicePayload`.
   */
  damage?: string;
}

/**
 * 10.2j Task H — vedle `total` vrací i strukturovaný `dicePayload`, aby
 * volající (token panel) mohl hod nasměrovat do map dice systému
 * (`useMapDiceRoll.roll` → 3D overlay + persist do map dice logu).
 */
export interface SheetRollResult {
  total: number;
  dicePayload: DicePayload;
  /** JaD: fatální úspěch (nat 20) / neúspěch (nat 1) — pro úpravu iniciativy. */
  crit?: 'success' | 'fail';
}

export function performSheetRoll(req: RollRequest): SheetRollResult | null {
  const { label, modifier = 0, kind = "fate" } = req;

  let total: number;
  let dicePayload: DicePayload;
  let crit: 'success' | 'fail' | undefined;

  // Shadowrun success-pool: `kind:'pool-d6'` + `pool` (počet kostek) → úspěchy
  // (5–6) + glitch místo součtu. Musí být PŘED generic větví (pool-d6 by jinak
  // spadl do rollGenericDice, který jen sčítá).
  if (typeof req.pool === "number" && kind.startsWith("pool-")) {
    const sides = parseInt(kind.replace("pool-d", ""), 10) || 6;
    const r = rollPoolHits(req.pool, sides);
    const payload = buildPoolHitsPayload(r, { label });
    attachBreakdown(payload, req);
    return { total: r.hits, dicePayload: payload };
  }

  if (kind === "fate") {
    const r = rollFate();
    total = r.sum + modifier;
    dicePayload = buildFatePayload(r, { label, modifier });
  } else if (kind === "mixed") {
    // JaD skládaný zásah (2k10+2k6+2k4+číslo) — rollMixedDice umí balík kostek.
    const r = rollMixedDice(req.mixed ?? {});
    total = r.sum + modifier;
    dicePayload = buildMixedPayload(r, { label, modifier });
  } else if (
    kind === "d4" ||
    kind === "d6" ||
    kind === "d6+" ||
    kind === "2d6+" ||
    kind === "d8" ||
    kind === "d10" ||
    kind === "d12" ||
    kind === "d20" ||
    kind === "d100"
  ) {
    // d6+ (nafukovací k6) / 2d6+ (otevřený 2k6, DrD+) = eskalující kostky;
    // rollGenericDice je dispatchne na vlastní primitivu (centralizováno
    // v rollEngine — payload zůstává generický, pole tváří proměnné délky).
    const r = rollGenericDice(kind);
    total = r.sum + modifier;
    // JaD fatální úspěch/neúspěch: jediná k20, přirozená 20 / 1.
    if (kind === "d20" && req.critOnD20 && r.rolls.length === 1) {
      if (r.rolls[0] === 20) crit = 'success';
      else if (r.rolls[0] === 1) crit = 'fail';
    }
    dicePayload = buildGenericPayload(r, { label, modifier, crit });
  } else {
    // pool nepodporováno z deníku v MVP
    toast.error(`Roll kind ${kind} není podporován ze sheet`);
    return null;
  }

  // 16b (DrdH) — předej dál rozpis složek + zranění (jen zobrazení, neovlivní
  // total ani faces). Ostatní systémy req.breakdown/damage neposílají → no-op.
  attachBreakdown(dicePayload, req);

  // 10.2j — žádný toast: hod se ukáže ve 3D overlayi + zapíše do dice logu
  // (rozpis výpočtu `label (mod) ± kostky = total` renderuje DiceLogPanel).
  // 10.2f/10.2j — vrací total (zápis iniciativy do `token.initiative`) +
  // dicePayload (směrování do map dice overlay / logu přes onMapRoll).
  return { total, dicePayload, crit };
}

/**
 * 16b — připne volitelný `breakdown` (složky modifieru) + `damage` (zranění)
 * z requestu na payload. Mutuje payload in-place (čerstvý objekt z builderu).
 */
function attachBreakdown(payload: DicePayload, req: RollRequest): void {
  if (req.breakdown && req.breakdown.length > 0) payload.breakdown = req.breakdown;
  if (req.damage) payload.damage = req.damage;
}
