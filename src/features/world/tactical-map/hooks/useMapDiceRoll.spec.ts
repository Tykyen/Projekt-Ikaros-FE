import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMapDiceRoll } from "./useMapDiceRoll";

describe("useMapDiceRoll", () => {
  it("custom hod → op dice.roll + overlay trigger", () => {
    const rollDice = vi.fn();
    const triggerOverlay = vi.fn();
    const { result } = renderHook(() =>
      useMapDiceRoll({
        viewer: { userId: "u1", isPj: false, displayName: "Tyky" },
        rollDice,
        triggerOverlay,
        getSkin: () => "core-obsidian",
      }),
    );
    const payload = { type: "d20", faces: [18], sum: 18, total: 18 } as never;
    result.current.roll({ category: "custom", dicePayload: payload });

    expect(rollDice).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "dice.roll",
        roll: expect.objectContaining({
          byUserId: "u1",
          rollerKind: "pc",
          category: "custom",
          rollerName: "Tyky",
          dicePayload: payload,
        }),
      }),
    );
    expect(triggerOverlay).toHaveBeenCalledWith(
      payload,
      "core-obsidian",
      "Tyky",
    );
  });

  it("PJ skill hod za NPC token → rollerKind/name override + tokenId", () => {
    const rollDice = vi.fn();
    const { result } = renderHook(() =>
      useMapDiceRoll({
        viewer: { userId: "gm", isPj: true, displayName: "PJ" },
        rollDice,
        triggerOverlay: vi.fn(),
        getSkin: () => "x",
      }),
    );
    result.current.roll({
      category: "skill",
      dicePayload: { type: "d20", faces: [3], sum: 3, total: 3 } as never,
      tokenId: "t9",
      rollerKind: "npc",
      rollerName: "Skřet",
    });
    expect(rollDice).toHaveBeenCalledWith(
      expect.objectContaining({
        roll: expect.objectContaining({
          rollerKind: "npc",
          rollerName: "Skřet",
          tokenId: "t9",
          category: "skill",
        }),
      }),
    );
  });

  it("produkuje id (crypto.randomUUID) + ISO rolledAt; tokenId chybí u custom", () => {
    const rollDice = vi.fn();
    const { result } = renderHook(() =>
      useMapDiceRoll({
        viewer: { userId: "u1", isPj: false, displayName: "Tyky" },
        rollDice,
        triggerOverlay: vi.fn(),
        getSkin: () => "core-obsidian",
      }),
    );
    result.current.roll({
      category: "custom",
      dicePayload: { type: "d6", faces: [4], sum: 4, total: 4 } as never,
    });
    const roll = rollDice.mock.calls[0][0].roll;
    expect(typeof roll.id).toBe("string");
    expect(roll.id.length).toBeGreaterThan(0);
    expect(roll.rolledAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect("tokenId" in roll).toBe(false);
  });
});
