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
 * Routing (klíč = `resolveSystemId(world.system)`, ne syrové id — nabídka
 * ukládá „dlouhá" id jako `drd-plus`/`call-of-cthulhu`):
 *   - bestie token → `BestiePanelView` (schema-driven statblok); matrix/drd16
 *     mají vlastní HUD bestie panel
 *   - matrix / dnd5e / jad / coc / drd2 / drd16 / drdplus / fate / gurps →
 *     per-system `*CombatPanel`
 *   - jiné (drdh, pi, sr, generic) → fallback na `DiaryTab` (legacy)
 *
 * Plán: docs/arch/phase-10/plan-10.2c-edit-9g.md §B; rozšíření 9h.
 */
import { useEffect, useRef } from "react";
import { DiaryTab } from "@/features/world/pages/CharacterDetailPage/components/DiaryTab";
import { useCharacterDiary } from "@/features/world/pages/api/useCharacterSubdocs";
import { useResolvedSystemId } from "@/features/world/useResolvedSystemId";
import { performSheetRoll } from "../../utils/rollFromSheet";
import { useTokenUpdate } from "../../hooks/useTokenUpdate";
import type { MapToken } from "../../types";
import type { MapRollRequest } from "../../hooks/useMapDiceRoll";
import { tokenIsBestie } from "../../utils/tokenIsBestie";
import { BestiePanelView } from "./BestiePanelView";
import { MatrixBestiePanel } from "./system-panels/MatrixBestiePanel";
import { PiBestiePanel } from "./system-panels/PiBestiePanel";
import { Drd16BestiePanel } from "./system-panels/Drd16BestiePanel";
import { DrdPlusBestiePanel } from "./system-panels/DrdPlusBestiePanel";
import { Drd2BestiePanel } from "./system-panels/Drd2BestiePanel";
import { JadBestiePanel } from "./system-panels/JadBestiePanel";
import { DndBestiePanel } from "./system-panels/DndBestiePanel";
import { FateBestiePanel } from "./system-panels/FateBestiePanel";
import { ShadowrunBestiePanel } from "./system-panels/ShadowrunBestiePanel";
import { COMBAT_PANELS, type CombatPanelProps } from "./combatPanels";
import { DiarySkinScope } from "@/features/world/pages/CharacterDetailPage/diary-systems/DiarySkinScope";
import { EmbedSubdocsBar } from "@/features/world/pages/CharacterDetailPage/components/embed/EmbedSubdocsBar";
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
  // Canonical systemId přes sdílený hook (D-SYSTEMID-HOOK).
  const systemId = useResolvedSystemId();
  // 10.2c-edit-9g Fáze E — Matrix-specific sync diary → token. Když user
  // změní `matrix_health` / `matrix_armor` v sheet a uloží, propagujeme
  // do token.currentHp / armor (token HP bar se okamžitě reflektuje;
  // ostatní hráči vidí přes WS broadcast). Reverse sync (token → diary)
  // defer na BE 10.2i (žádný WS pro character diary).
  useMatrixDiaryToTokenSync({
    enabled: systemId === "matrix" && canEdit,
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
    if (systemId === "matrix") {
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
    // Příběhy Impéria — pi bestie HUD (osekaný Matrix derivát, sci-fi).
    if (systemId === "pi") {
      return (
        <DiarySkinScope worldId={worldId} className={styles.sheet}>
          <PiBestiePanel
            token={token}
            sceneId={sceneId}
            worldId={worldId}
            systemId="pi"
            canEdit={canEdit}
            onMapRoll={onMapRoll}
          />
        </DiarySkinScope>
      );
    }
    // 16.2b Fáze 2 — drd16 bestie: bojové minimum + d6+ (init/útoky/OČ).
    if (systemId === "drd16") {
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
    // 16.2d Fáze 2 — DrD+ bestie: pergamen panel (2k6+/d6, BČ→iniciativa,
    // číselný wound + postih, in-place edit).
    if (systemId === "drdplus") {
      return (
        <DiarySkinScope worldId={worldId} className={styles.sheet}>
          <DrdPlusBestiePanel
            token={token}
            sceneId={sceneId}
            worldId={worldId}
            systemId="drdplus"
            canEdit={canEdit}
            onMapRoll={onMapRoll}
          />
        </DiarySkinScope>
      );
    }
    // 16.2e Fáze 2 — drd2 bestie: fantasy pergamen statblok (Sudba HP,
    // Hranice reference, Charakteristiky klik=2k6+úroveň, ZS poznámky).
    if (systemId === "drd2") {
      return (
        <DiarySkinScope worldId={worldId} className={styles.sheet}>
          <Drd2BestiePanel
            token={token}
            sceneId={sceneId}
            worldId={worldId}
            systemId="drd2"
            canEdit={canEdit}
            onMapRoll={onMapRoll}
          />
        </DiarySkinScope>
      );
    }
    // 8.7r krok 2 — JaD bestie: pergamen statblok, k20 (fatální), klikací
    // útoky (k20 + mixed zásah) a záchrany/zdatnosti, iniciativa k20 + Obr.
    if (systemId === "jad") {
      return (
        <DiarySkinScope worldId={worldId} className={styles.sheet}>
          <JadBestiePanel
            token={token}
            sceneId={sceneId}
            worldId={worldId}
            systemId="jad"
            canEdit={canEdit}
            onMapRoll={onMapRoll}
          />
        </DiarySkinScope>
      );
    }
    // FATE (fae + fate) bestie — „Karty osudu" combat panel (sdílí jádro s PC).
    if (systemId === "fae" || systemId === "fate") {
      return (
        <DiarySkinScope worldId={worldId} className={styles.sheet}>
          <FateBestiePanel
            token={token}
            sceneId={sceneId}
            worldId={worldId}
            systemId={systemId}
            canEdit={canEdit}
            onMapRoll={onMapRoll}
          />
        </DiarySkinScope>
      );
    }
    // Shadowrun 6e bestie — jantarový statblok (sdílí jádro s PC combat panelem).
    if (systemId === "shadowrun") {
      return (
        <DiarySkinScope worldId={worldId} className={styles.sheet}>
          <ShadowrunBestiePanel
            token={token}
            sceneId={sceneId}
            worldId={worldId}
            canEdit={canEdit}
            onMapRoll={onMapRoll}
          />
        </DiarySkinScope>
      );
    }
    // 8.7s — D&D 5e bestie = klon JaD (pergamen statblok, k20 fatální, mixed zásah).
    if (systemId === "dnd5e") {
      return (
        <DiarySkinScope worldId={worldId} className={styles.sheet}>
          <DndBestiePanel
            token={token}
            sceneId={sceneId}
            worldId={worldId}
            systemId="dnd5e"
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
        systemId={systemId || "generic"}
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
      critOnD20: req.critOnD20,
      mixed: req.mixed,
      pool: req.pool,
      breakdown: req.breakdown,
      damage: req.damage,
      rollerName,
    });
    if (!res) return;
    // Iniciativa: explicitní flag (DrD+ Boj/BČ) NEBO label „Iniciativa" (BC).
    const isInit = req.initiative ?? /iniciativ/i.test(req.label);
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
      // 8.7q JaD: fatální úspěch = absolutně první, fatální neúspěch = poslední
      // (lišta řadí dle čísla; ±100 přebije běžný rozsah k20+mod).
      const initValue =
        res.crit === "success"
          ? res.total + 100
          : res.crit === "fail"
            ? res.total - 100
            : res.total;
      // 10.2j — skipInvalidate: běží paralelně s `dice.roll` (onMapRoll výš).
      // Bez toho invalidate refetch sestřelí ještě nepersistovaný hod z logu.
      initiativeUpdate.mutate({
        tokenId: token.id,
        patch: { initiative: initValue },
        skipInvalidate: true,
      });
    }
  };

  // 10.2c-edit-9h — per-system kompaktní combat panel (Matrix/DnD/CoC/Drd2/
  // Drd16/DrdPlus/Fate/GURPS). Ostatní systémy fallback na DiaryTab (legacy).
  // `systemId` je už normalizované (drd-plus→drdplus) — viz nahoře.
  const SystemPanel = systemId ? COMBAT_PANELS[systemId] : undefined;

  if (SystemPanel) {
    return (
      <DiarySkinScope worldId={worldId} className={styles.sheet}>
        {!token.isNpc && (
          <EmbedSubdocsBar worldId={worldId} slug={token.characterSlug} canEdit={canEdit} />
        )}
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
      <EmbedSubdocsBar worldId={worldId} slug={token.characterSlug} canEdit={canEdit} />
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
