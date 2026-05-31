import { useRef, useState } from "react";
import { Dices } from "lucide-react";
import {
  DicePickerPopover,
  type DiceRollResult,
} from "@/features/world/chat/dice/components/DicePickerPopover";
import { PoolPromptModal } from "@/features/world/chat/dice/components/PoolPromptModal";
import { SkinPickerPanel } from "@/features/world/chat/dice/components/SkinPickerPanel";
import { useDiceSkinMapping } from "@/features/world/chat/dice/api/useDiceSkinMapping";
import type { DicePayload } from "@/features/world/chat/dice/lib/dicePayload";
import styles from "./DiceRollButton.module.css";

interface DiceRollButtonProps {
  worldId: string;
  worldSlug: string;
  worldDice: string[];
  canManageWorld: boolean;
  /** Vlastní hod hotový → předá payload nahoru (G3 ho pošle do useMapDiceRoll). */
  onRoll: (dicePayload: DicePayload) => void;
}

/**
 * 10.2j — Spouštěč „vlastní hod" na taktické mapě.
 *
 * Reuse 6.3 dice komponent (picker popover + skin picker + pool/mixed prompt),
 * napojených tak, že produkují `DicePayload` a předají ho přes `onRoll`
 * nahoru. Tato komponenta sama **netriggeruje overlay** ani nic neperzistuje —
 * to obstará parent (G3) přes `useMapDiceRoll.roll({ category: 'custom' })`.
 */
export function DiceRollButton({
  worldId,
  worldSlug,
  worldDice,
  canManageWorld,
  onRoll,
}: DiceRollButtonProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [skinPickerOpen, setSkinPickerOpen] = useState(false);
  const [poolPrompt, setPoolPrompt] = useState<"pool" | "mixed" | null>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const { getSkin } = useDiceSkinMapping(worldId);

  const handleRoll = (result: DiceRollResult) => {
    onRoll(result.dicePayload);
    setPickerOpen(false);
  };

  return (
    <div className={styles.wrap}>
      <button
        ref={anchorRef}
        type="button"
        className={`${styles.btn} ${pickerOpen ? styles.active : ""}`}
        onClick={() => setPickerOpen((v) => !v)}
        title="Vlastní hod"
        aria-label="Vlastní hod"
        aria-pressed={pickerOpen}
      >
        <Dices size={18} aria-hidden="true" />
      </button>

      <DicePickerPopover
        anchorRef={anchorRef}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        worldDice={worldDice}
        worldSlug={worldSlug}
        canManageWorld={canManageWorld}
        getSkin={getSkin}
        onOpenSkinPicker={() => setSkinPickerOpen(true)}
        onOpenPoolPrompt={(kind) => setPoolPrompt(kind)}
        onRoll={handleRoll}
      />

      {poolPrompt && (
        <PoolPromptModal
          open
          kind={poolPrompt}
          onClose={() => setPoolPrompt(null)}
          worldDice={worldDice}
          getSkin={getSkin}
          onRoll={handleRoll}
        />
      )}

      <SkinPickerPanel
        open={skinPickerOpen}
        onClose={() => setSkinPickerOpen(false)}
        worldId={worldId}
      />
    </div>
  );
}
