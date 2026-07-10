import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock skin mapping hook — žádná síť. Plný tvar (SkinPickerPanel volá hook
// interně a čte `jailed`, `isJailed`, ...).
vi.mock("@/features/world/chat/dice/api/useDiceSkinMapping", () => ({
  useDiceSkinMapping: () => ({
    mapping: null,
    jailed: [],
    getSkin: () => "core-obsidian",
    setSkin: () => {},
    resetSkins: () => {},
    toggleJail: () => {},
    isJailed: () => false,
    isLoading: false,
    isUpdating: false,
  }),
}));

import { DiceRollButton } from "./DiceRollButton";

const baseProps = {
  worldId: "w1",
  worldSlug: "svet",
  worldDice: ["1d20", "1d6"],
  canManageWorld: false,
  onRoll: vi.fn(),
};

describe("DiceRollButton", () => {
  it("renderuje 🎲 tlačítko s aria-label", () => {
    render(<DiceRollButton {...baseProps} />);
    expect(
      screen.getByRole("button", { name: "Hod kostkou" }),
    ).toBeInTheDocument();
  });

  it("klik otevře dice picker popover", () => {
    render(<DiceRollButton {...baseProps} />);
    const btn = screen.getByRole("button", { name: "Hod kostkou" });
    // Picker zavřený → header "Hod kostkou" není v DOM.
    expect(screen.queryByText("Hod kostkou")).not.toBeInTheDocument();
    fireEvent.click(btn);
    // Otevřený popover renderuje hlavičku + dialog.
    expect(screen.getByText("Hod kostkou")).toBeInTheDocument();
    expect(btn).toHaveAttribute("aria-pressed", "true");
  });
});
