import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { World } from "@/shared/types";

const mutateAsync = vi.fn().mockResolvedValue({});

vi.mock("@/features/world/api/useUpdateWorld", () => ({
  useUpdateWorld: () => ({ mutateAsync, isPending: false }),
}));
vi.mock("@/shared/api", () => ({
  useUploadImage: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
// PillChips (kostky/mechaniky) je pro tento test irelevantní; stub drží
// act() teardown rychlý a focus na checkboxech diceVisibility.
vi.mock("@/features/ikaros/pages/CreateWorldPage/components/PillChips", () => ({
  PillChips: () => null,
}));

const world = {
  id: "w1",
  slug: "svet",
  name: "Svět",
  description: "",
  genre: "",
  system: "drd2",
  dice: [],
  maxPlayers: null,
  playersWanted: "",
  imageUrl: "",
  diceVisibility: undefined,
} as unknown as World;

vi.mock("@/features/world/context/WorldContext", () => ({
  useWorldContext: () => ({ world }),
}));

describe("BasicInfoTab — diceVisibility (10.2j)", () => {
  it("uloží diceVisibility patch (10.2j)", async () => {
    const { default: BasicInfoTab } = await import("../tabs/BasicInfoTab");
    render(<BasicInfoTab />);

    fireEvent.click(screen.getByLabelText(/Hráči vidí PJ hody/i));
    fireEvent.click(screen.getByRole("button", { name: /Uložit změny/i }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          diceVisibility: {
            showPjRolls: true,
            showNpcBestieRolls: false,
            showTeammateRolls: true,
          },
        }),
      ),
    );
    // BasicInfoTab mountuje těžký Button/SettingsPanel/form — jsdom teardown
    // se na pomalejších CI strojích blíží 5 s, proto navýšený timeout.
  }, 15000);
});
