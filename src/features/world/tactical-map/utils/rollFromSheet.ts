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
  type RollKind,
} from "@/features/world/chat/dice/lib/rollEngine";
import {
  buildFatePayload,
  buildGenericPayload,
  type DicePayload,
} from "@/features/world/chat/dice/lib/dicePayload";

export interface RollRequest {
  /** Lidský label (jméno dovednosti / „Iniciativa"). */
  label: string;
  /** Modifikátor přidaný k roll sumu (např. skill level). Default 0. */
  modifier?: number;
  /**
   * Typ kostky. `fate` = 4dF (Matrix / Fate). `d20` / `d6` / ... pro
   * generic systémy. Pro nestandartní pool kostky volej rollEngine přímo.
   */
  kind?: RollKind;
  /**
   * Kdo rolluje. 10.2j — už se nepoužívá (toast zrušen, jméno v logu řeší
   * `useMapDiceRoll` z vieweru). Ponecháno kvůli zpětné kompatibilitě volajících.
   */
  rollerName?: string;
}

/**
 * 10.2j Task H — vedle `total` vrací i strukturovaný `dicePayload`, aby
 * volající (token panel) mohl hod nasměrovat do map dice systému
 * (`useMapDiceRoll.roll` → 3D overlay + persist do map dice logu).
 */
export interface SheetRollResult {
  total: number;
  dicePayload: DicePayload;
}

export function performSheetRoll(req: RollRequest): SheetRollResult | null {
  const { label, modifier = 0, kind = "fate" } = req;

  let total: number;
  let dicePayload: DicePayload;

  if (kind === "fate") {
    const r = rollFate();
    total = r.sum + modifier;
    dicePayload = buildFatePayload(r, { label, modifier });
  } else if (
    kind === "d4" ||
    kind === "d6" ||
    kind === "d8" ||
    kind === "d10" ||
    kind === "d12" ||
    kind === "d20" ||
    kind === "d100"
  ) {
    const r = rollGenericDice(kind);
    total = r.sum + modifier;
    dicePayload = buildGenericPayload(r, { label, modifier });
  } else {
    // pool/mixed nepodporováno z deníku v MVP
    toast.error(`Roll kind ${kind} není podporován ze sheet`);
    return null;
  }

  // 10.2j — žádný toast: hod se ukáže ve 3D overlayi + zapíše do dice logu
  // (rozpis výpočtu `label (mod) ± kostky = total` renderuje DiceLogPanel).
  // 10.2f/10.2j — vrací total (zápis iniciativy do `token.initiative`) +
  // dicePayload (směrování do map dice overlay / logu přes onMapRoll).
  return { total, dicePayload };
}
