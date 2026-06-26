/**
 * 10.2c-edit-9g → 9h — embedded per-system combat panel uvnitř TokenInfoPanel.
 *
 * Předtím (9g): embed `DiaryTab` — plný editor deníku, vhodné jen jako fallback
 * pro systémy bez kompaktního panelu.
 *
 * Nyní (9h): per-system kompaktní bojový panel (`*CombatPanel`) podle vzoru
 * starého Matrixu `CharacterDiary.tsx` — STATY/DOVEDNOSTI/atd., klikací rolly,
 * INICIATIVA quick-button. Skryté roleplay sekce (Overview, Inventory, Notes —
 * ty zůstávají v plné `CharacterDetailPage`).
 *
 * Routing:
 *   - bestie token → `BestiePanelView` (schema-driven statblok)
 *   - matrix / dnd5e / coc / drd2 / fate / gurps → per-system `*CombatPanel`
 *   - jiné (jad, drdh, drdplus, pi, sr) → fallback na `DiaryTab` (legacy)
 *
 * Plán: docs/arch/phase-10/plan-10.2c-edit-9g.md §B; rozšíření 9h.
 */
import { useEffect, useRef } from "react";
import { DiaryTab } from "@/features/world/pages/CharacterDetailPage/components/DiaryTab";
import { useCharacterDiary } from "@/features/world/pages/api/useCharacterSubdocs";
import { useWorldContext } from "@/features/world/context/WorldContext";
import { performSheetRoll } from "../../utils/rollFromSheet";
import { useTokenUpdate } from "../../hooks/useTokenUpdate";
import type { MapToken } from "../../types";
import type { MapRollRequest } from "../../hooks/useMapDiceRoll";
import { tokenIsBestie } from "../../utils/tokenIsBestie";
import { BestiePanelView } from "./BestiePanelView";
import { MatrixBestiePanel } from "./system-panels/MatrixBestiePanel";
import { Drd16BestiePanel } from "./system-panels/Drd16BestiePanel";
import { COMBAT_PANELS, type CombatPanelProps } from "./combatPanels";
import { DiarySkinScope } from "@/features/world/pages/CharacterDetailPage/diary-systems/DiarySkinScope";
import styles from "./TokenSystemSheet.module.css";

interface Props {
  token: MapToken;
  sceneId: string;
  worldId: string;
  canEdit: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  /**
   * 10.2j Task H — směruje sheet hody (skill + iniciativa) do map dice
   * systému (3D overlay + persist do map dice logu). Pokud chybí (CHAT /
   * CharacterDetailPage embed), hod se chová po staru (jen toast).
   */
  onMapRoll?: (req: MapRollRequest) => void;
}

export function TokenSystemSheet({
  token,
  sceneId,
  worldId,
  canEdit,
  onDirtyChange,
  onMapRoll,
}: Props): React.ReactElement {
  const { world } = useWorldContext();
  // 10.2c-edit-9g Fáze E — Matrix-specific sync diary → token. Když user
  // změní `matrix_health` / `matrix_armor` v sheet a uloží, propagujeme
  // do token.currentHp / armor (token HP bar se okamžitě reflektuje;
  // ostatní hráči vidí přes WS broadcast). Reverse sync (token → diary)
  // defer na BE 10.2i (žádný WS pro character diary).
  useMatrixDiaryToTokenSync({
    enabled: world?.system === "matrix" && canEdit,
    token,
    sceneId,
    worldId,
  });

  // 10.2f — hod „Iniciativa" z panelu se propíše do token.initiative
  // (combat tracker / iniciativní lišta). Hook musí být před bestie return.
  const initiativeUpdate = useTokenUpdate(sceneId, worldId);

  if (tokenIsBestie(token)) {
    // 16.2a — Matrix bestie má vlastní HUD panel (HP výpočet, autosave,
    // iniciativa sjednocení); ostatní systémy generický schema engine.
    if (world?.system === "matrix") {
      return (
        <DiarySkinScope worldId={worldId} className={styles.sheet}>
          <MatrixBestiePanel
            token={token}
            sceneId={sceneId}
            worldId={worldId}
            systemId="matrix"
            canEdit={canEdit}
            onMapRoll={onMapRoll}
          />
        </DiarySkinScope>
      );
    }
    // 16.2b Fáze 2 — drd16 bestie: bojové minimum + d6+ (init/útoky/OČ).
    if (world?.system === "drd16") {
      return (
        <DiarySkinScope worldId={worldId} className={styles.sheet}>
          <Drd16BestiePanel
            token={token}
            sceneId={sceneId}
            worldId={worldId}
            systemId="drd16"
            canEdit={canEdit}
            onMapRoll={onMapRoll}
          />
        </DiarySkinScope>
      );
    }
    return (
      <BestiePanelView
        token={token}
        sceneId={sceneId}
        worldId={worldId}
        systemId={world?.system ?? "generic"}
        canEdit={canEdit}
        onMapRoll={onMapRoll}
      />
    );
  }

  const rollerName =
    token.instanceName ?? token.characterData?.name ?? "Postava";
  // 10.2j Task H — token je tady vždy ne-bestie (bestie větev vrací výše).
  // Rozlišíme NPC vs PC dle `isNpc` discriminatoru (stejný jako spawn/HP).
  const rollerKind: NonNullable<MapRollRequest["rollerKind"]> = token.isNpc
    ? "npc"
    : "pc";

  const onRoll: NonNullable<CombatPanelProps["onRoll"]> = (req) => {
    const res = performSheetRoll({
      label: req.label,
      modifier: req.modifier,
      kind: req.kind,
      rollerName,
    });
    if (!res) return;
    const isInit = /iniciativ/i.test(req.label);
    // 10.2j Task H — hod nasměruj do map dice systému (3D overlay + map log).
    onMapRoll?.({
      category: isInit ? "initiative" : "skill",
      dicePayload: res.dicePayload,
      tokenId: token.id,
      rollerKind,
      rollerName,
    });
    // 10.2f — hod iniciativy z panelu se propíše do token.initiative
    // (objeví se v iniciativní liště). Detekce dle labelu „Iniciativa".
    if (isInit) {
      // 10.2j — skipInvalidate: běží paralelně s `dice.roll` (onMapRoll výš).
      // Bez toho invalidate refetch sestřelí ještě nepersistovaný hod z logu.
      initiativeUpdate.mutate({
        tokenId: token.id,
        patch: { initiative: res.total },
        skipInvalidate: true,
      });
    }
  };

  // 10.2c-edit-9h — per-system kompaktní combat panel (Matrix/DnD/CoC/Drd2/
  // Fate/GURPS). Ostatní systémy fallback na DiaryTab embed (legacy).
  const SystemPanel = world?.system ? COMBAT_PANELS[world.system] : undefined;

  if (SystemPanel) {
    return (
      <DiarySkinScope worldId={worldId} className={styles.sheet}>
        <SystemPanel
          token={token}
          sceneId={sceneId}
          worldId={worldId}
          canEdit={canEdit}
          onRoll={onRoll}
        />
      </DiarySkinScope>
    );
  }

  return (
    <DiarySkinScope worldId={worldId} className={styles.sheet}>
      <DiaryTab
        slug={token.characterSlug}
        mode={canEdit ? "edit" : "view"}
        onExitEdit={() => {
          /* panel close = exit */
        }}
        onDirtyChange={onDirtyChange ?? (() => {})}
        onRoll={onRoll}
      />
    </DiarySkinScope>
  );
}

/**
 * 10.2c-edit-9g Fáze E — pull-based sync diary → token (jednosměrný MVP).
 *
 * Sleduje `useCharacterDiary` query. Při změně `matrix_health` / `matrix_armor`
 * v diary (po user save), volá `token.update` s odpovídajícím patch.
 *
 * Mapping:
 *   - `customData.matrix_health` (0..5) → `token.currentHp`
 *   - `customData.matrix_armor` → `token.armor`
 *
 * Tiredness defer (token nemá fixed pole; uložení do `systemStats` přidat
 * až s `generic:token` schema extension).
 *
 * Reverse sync (token → diary) defer 10.2i (BE WS pro character.diary).
 */
function useMatrixDiaryToTokenSync({
  enabled,
  token,
  sceneId,
  worldId,
}: {
  enabled: boolean;
  token: MapToken;
  sceneId: string;
  worldId: string;
}): void {
  const { data: diary } = useCharacterDiary(worldId, token.characterSlug);
  const update = useTokenUpdate(sceneId, worldId);
  const lastSyncedRef = useRef<{ health: number; armor: number } | null>(null);

  useEffect(() => {
    if (!enabled || !diary) return;
    const cd = diary.customData ?? {};
    const matrixHealth = parseInt(String(cd.matrix_health ?? "5"), 10) || 0;
    const matrixArmor = parseInt(String(cd.matrix_armor ?? "0"), 10) || 0;

    // První render = baseline, žádný push (token už má serverové hodnoty)
    if (lastSyncedRef.current === null) {
      lastSyncedRef.current = { health: matrixHealth, armor: matrixArmor };
      return;
    }

    const prev = lastSyncedRef.current;
    const healthChanged = prev.health !== matrixHealth;
    const armorChanged = prev.armor !== matrixArmor;
    if (!healthChanged && !armorChanged) return;

    // Push do tokenu — patch jen změněné fields
    const patch: Partial<MapToken> = {};
    if (healthChanged) patch.currentHp = matrixHealth;
    if (armorChanged) patch.armor = matrixArmor;

    lastSyncedRef.current = { health: matrixHealth, armor: matrixArmor };
    update.mutate({ tokenId: token.id, patch });
    // Note: update.mutate je deps-stable přes useMutation, ESLint může
    // chtít [update] — necháme bez (mutate identity je stable).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, diary, token.id]);
}
