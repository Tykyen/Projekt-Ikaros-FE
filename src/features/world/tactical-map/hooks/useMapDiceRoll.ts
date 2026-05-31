import { useCallback } from "react";

import type { DicePayload } from "@/features/world/chat/dice/lib/dicePayload";

import type { MapDiceRoll, DiceRollCategory, DiceRollerKind } from "../types";

/**
 * 10.2j Task F2 — orchestrace hodu kostkou na taktické mapě.
 *
 * Hook převede „roll request" na (1) persistovanou `dice.roll` map operaci a
 * (2) lokální 3D overlay pro toho, kdo hází. Závislosti jsou injektované, aby
 * hook zůstal testovatelný a decoupled — reálné zapojení (rollDice z
 * useMapScene, overlay trigger z 6.3, skin resolver z useDiceSkinMapping)
 * přijde v G3.
 */

export interface MapDiceRollViewer {
  userId: string;
  isPj: boolean;
  displayName: string;
}

export interface UseMapDiceRollDeps {
  viewer: MapDiceRollViewer;
  /** Persistuje hod jako map op (z useMapScene). */
  rollDice: (op: { type: "dice.roll"; roll: MapDiceRoll }) => void;
  /** Spustí lokální 3D overlay tomu, kdo háže (z 6.3 overlay kontextu). */
  triggerOverlay: (
    payload: DicePayload,
    skinId: string | null,
    rollerName: string,
  ) => void;
  /** Resolver skinu per typ kostky (z useDiceSkinMapping). */
  getSkin: (typeKey: string) => string;
}

export interface MapRollRequest {
  category: DiceRollCategory;
  dicePayload: DicePayload;
  /** Token, za který se hází (skill/initiative). */
  tokenId?: string;
  /** Default: viewer.isPj ? 'pj' : 'pc'. Caller přebije pro NPC/bestii. */
  rollerKind?: DiceRollerKind;
  /** Default: viewer.displayName. Caller přebije jménem postavy/NPC. */
  rollerName?: string;
}

export interface UseMapDiceRollResult {
  roll: (req: MapRollRequest) => void;
}

export function useMapDiceRoll(deps: UseMapDiceRollDeps): UseMapDiceRollResult {
  const { viewer, rollDice, triggerOverlay, getSkin } = deps;

  const roll = useCallback(
    (req: MapRollRequest) => {
      const rollerName = req.rollerName ?? viewer.displayName;
      const mapRoll: MapDiceRoll = {
        id: crypto.randomUUID(),
        rolledAt: new Date().toISOString(),
        byUserId: viewer.userId,
        rollerName,
        rollerKind: req.rollerKind ?? (viewer.isPj ? "pj" : "pc"),
        category: req.category,
        ...(req.tokenId !== undefined ? { tokenId: req.tokenId } : {}),
        dicePayload: req.dicePayload,
      };

      rollDice({ type: "dice.roll", roll: mapRoll });
      triggerOverlay(
        req.dicePayload,
        getSkin(req.dicePayload.type),
        rollerName,
      );
    },
    [viewer, rollDice, triggerOverlay, getSkin],
  );

  return { roll };
}
