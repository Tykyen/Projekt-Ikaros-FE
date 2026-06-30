import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DiceLogPanel } from "./DiceLogPanel";
import type { MapDiceRoll } from "../../types";

const mkRoll = (
  kind: MapDiceRoll["rollerKind"],
  by: string,
  id = by + kind,
  rolledAt = "2026-05-31T08:00:00.000Z",
): MapDiceRoll => ({
  id,
  rolledAt,
  byUserId: by,
  rollerName: by,
  rollerKind: kind,
  category: "custom",
  dicePayload: { type: "d20", faces: [18], sum: 18, total: 18 } as never,
});

beforeEach(() => localStorage.clear());

describe("DiceLogPanel", () => {
  it("hráč vidí jen viditelné hody (vlastní + spoluhráč, ne PJ)", () => {
    const rolls = [
      mkRoll("pc", "me"),
      mkRoll("pj", "gm"),
      mkRoll("pc", "other"),
    ];
    render(
      <DiceLogPanel
        rolls={rolls}
        viewer={{ userId: "me", isPj: false }}
        visibility={{
          showPjRolls: false,
          showNpcBestieRolls: false,
          showTeammateRolls: true,
        }}
        sceneId="s1"
      />,
    );
    expect(screen.getAllByTestId("dice-log-entry")).toHaveLength(2);
  });

  it("clear schová starší hody a zapíše clearedBefore do localStorage", () => {
    const rolls = [mkRoll("pc", "me", "me-old", "2020-01-01T00:00:00.000Z")];
    render(
      <DiceLogPanel
        rolls={rolls}
        viewer={{ userId: "me", isPj: false }}
        visibility={undefined}
        sceneId="s1"
      />,
    );
    expect(screen.getAllByTestId("dice-log-entry")).toHaveLength(1);
    fireEvent.click(
      screen.getByRole("button", { name: /vymazat|vyčistit|clear/i }),
    );
    expect(screen.queryAllByTestId("dice-log-entry")).toHaveLength(0);
    expect(localStorage.getItem("ikr-map-dice-cleared-s1")).toBeTruthy();
  });

  it("rozpis d6+ rozepíše kaskádu: (mod) + (a + b + c) = total", () => {
    const roll: MapDiceRoll = {
      id: "r1",
      rolledAt: "2026-05-31T08:00:00.000Z",
      byUserId: "me",
      rollerName: "me",
      rollerKind: "pc",
      category: "skill",
      dicePayload: {
        type: "d6+",
        faces: [6, 6, 3],
        sum: 15,
        total: 22,
        label: "Útok: Meč",
        modifier: 7,
      } as never,
    };
    render(
      <DiceLogPanel
        rolls={[roll]}
        viewer={{ userId: "me", isPj: false }}
        visibility={undefined}
        sceneId="s9"
      />,
    );
    expect(
      screen.getByText("Útok: Meč (+7) + (6 + 6 + 3) = +22"),
    ).toBeTruthy();
  });

  it("16b DrdH: rozpis útoku zbraně se složkami + zranění se znaménkem", () => {
    const roll: MapDiceRoll = {
      id: "drdh-atk",
      rolledAt: "2026-05-31T08:00:00.000Z",
      byUserId: "me",
      rollerName: "me",
      rollerKind: "pc",
      category: "skill",
      dicePayload: {
        type: "d6+",
        faces: [3],
        sum: 3,
        total: 8,
        label: "Útok: Květinový meč",
        modifier: 5,
        breakdown: [
          { label: "útoč", value: 6 },
          { label: "Sil", value: -1 },
        ],
        damage: "+1",
      } as never,
    };
    render(
      <DiceLogPanel
        rolls={[roll]}
        viewer={{ userId: "me", isPj: false }}
        visibility={undefined}
        sceneId="s-drdh-atk"
      />,
    );
    expect(
      screen.getByText(
        "Útok: Květinový meč · útoč +6 + Sil −1 + hod (3) = 8 / +1",
      ),
    ).toBeTruthy();
  });

  it("16b DrdH: rozpis obrany BEZ zranění", () => {
    const roll: MapDiceRoll = {
      id: "drdh-def",
      rolledAt: "2026-05-31T08:00:00.000Z",
      byUserId: "me",
      rollerName: "me",
      rollerKind: "pc",
      category: "skill",
      dicePayload: {
        type: "d6+",
        faces: [4],
        sum: 4,
        total: 7,
        label: "Obrana: Štít",
        modifier: 3,
        breakdown: [
          { label: "obr", value: 2 },
          { label: "Obr", value: 1 },
        ],
      } as never,
    };
    render(
      <DiceLogPanel
        rolls={[roll]}
        viewer={{ userId: "me", isPj: false }}
        visibility={undefined}
        sceneId="s-drdh-def"
      />,
    );
    expect(
      screen.getByText("Obrana: Štít · obr +2 + Obr +1 + hod (4) = 7"),
    ).toBeTruthy();
  });

  it("fate rozpis zůstává v ± součet tvaru (žádná regrese Matrix)", () => {
    const roll: MapDiceRoll = {
      id: "r2",
      rolledAt: "2026-05-31T08:00:00.000Z",
      byUserId: "me",
      rollerName: "me",
      rollerKind: "pc",
      category: "skill",
      dicePayload: {
        type: "fate",
        faces: ["+", "-", "0", "0"],
        sum: 0,
        total: 1,
        label: "Magie",
        modifier: 1,
      } as never,
    };
    render(
      <DiceLogPanel
        rolls={[roll]}
        viewer={{ userId: "me", isPj: false }}
        visibility={undefined}
        sceneId="s10"
      />,
    );
    expect(screen.getByText("Magie (+1) + 0 = +1")).toBeTruthy();
  });

  it("8.7q: fatální úspěch/neúspěch zobrazí text místo součtu", () => {
    const crit = (c: "success" | "fail"): MapDiceRoll => ({
      id: "crit-" + c,
      rolledAt: "2026-05-31T08:00:00.000Z",
      byUserId: "me",
      rollerName: "me",
      rollerKind: "pc",
      category: "skill",
      dicePayload: {
        type: "d20",
        faces: [c === "success" ? 20 : 1],
        sum: c === "success" ? 20 : 1,
        total: c === "success" ? 23 : 4,
        crit: c,
      } as never,
    });
    render(
      <DiceLogPanel
        rolls={[crit("success"), crit("fail")]}
        viewer={{ userId: "me", isPj: false }}
        visibility={undefined}
        sceneId="s-crit"
      />,
    );
    expect(screen.getByText("Fatální úspěch")).toBeInTheDocument();
    expect(screen.getByText("Fatální neúspěch")).toBeInTheDocument();
    // Součet (23 / 4) se NEzobrazí jako hlavní výsledek.
    expect(screen.queryByText("23")).not.toBeInTheDocument();
  });

  it("PJ vidí všechny hody", () => {
    const rolls = [
      mkRoll("pc", "me"),
      mkRoll("pj", "gm"),
      mkRoll("npc", "gm", "n1"),
    ];
    render(
      <DiceLogPanel
        rolls={rolls}
        viewer={{ userId: "pjuser", isPj: true }}
        visibility={{
          showPjRolls: false,
          showNpcBestieRolls: false,
          showTeammateRolls: false,
        }}
        sceneId="s2"
      />,
    );
    expect(screen.getAllByTestId("dice-log-entry")).toHaveLength(3);
  });
});
