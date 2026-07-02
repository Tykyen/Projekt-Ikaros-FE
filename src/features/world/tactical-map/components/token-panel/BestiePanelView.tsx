/**
 * 10.2c-edit-9g Fáze 9c — bestie statblok view pro TokenInfoPanel.
 *
 * Wrapper kolem `BestieStatblock` který drží vlastní state (stats z
 * token.systemStats nebo BC fallback) + save handler přes `useTokenUpdate`.
 *
 * Bestie nemá Character record / deník — jen statblok (per-system schema)
 * + `bestie.notes` z bestiarQueryKey cache (PJ-only).
 */
import { useState } from "react";
import { toast } from "sonner";
import { BestieStatblock } from "../tokens/BestieStatblock";
import type { AbilityDraft } from "../tokens/BestieStatblock";
import { useTokenUpdate } from "../../hooks/useTokenUpdate";
import { performSheetRoll } from "../../utils/rollFromSheet";
import { useResolvedEntitySchema } from "../../schemas/useEntitySchemaVersions";
import type { MapToken } from "../../types";
import type { MapRollRequest } from "../../hooks/useMapDiceRoll";
import styles from "./TokenSystemSheet.module.css";

interface Props {
  token: MapToken;
  sceneId: string;
  worldId: string;
  systemId: string;
  canEdit: boolean;
  /**
   * 10.2j Task H — směruje bestie hody (statblok schopnosti + iniciativa)
   * do map dice systému (3D overlay + map log). Bez něj jen toast.
   */
  onMapRoll?: (req: MapRollRequest) => void;
}

export function BestiePanelView({
  token,
  sceneId,
  worldId,
  systemId,
  canEdit,
  onMapRoll,
}: Props): React.ReactElement {
  // BC fallback: pokud systemStats prázdné, mapuj z fixed pole.
  const baseStats: Record<string, unknown> =
    token.systemStats && Object.keys(token.systemStats).length > 0
      ? { ...token.systemStats }
      : {
          "health.current": token.currentHp,
          "health.max": token.maxHp,
          armor: token.armor,
          injury: token.injury,
          movement: token.movement,
          "initiative.current": token.initiative,
          "initiative.base": token.initiativeBase,
        };
  // BC normalizace: staré bestie snapshoty držely jen `health.max` (žádné
  // `health.current`) → HP pole se nenaplnilo. Dopočítej z max / currentHp.
  if (baseStats["health.current"] === undefined) {
    baseStats["health.current"] =
      baseStats["health.max"] ?? token.currentHp ?? token.maxHp ?? 0;
  }

  const [stats, setStats] = useState<Record<string, unknown>>(baseStats);
  // Schopnosti instance — z token snapshotu, v UI {label,value}. Token tvar je
  // {name,description}, ALE cross-system / starší snapshoty drží {label,value} →
  // čteme robustně oba tvary a coerce na string, ať `undefined` label neshodí
  // render (BestieStatblock volá `a.label.trim()`). Bez toho spadne celá mapa.
  const [abilities, setAbilities] = useState<AbilityDraft[]>(
    (token.abilities ?? []).map((a) => {
      const raw = a as {
        name?: string;
        description?: string;
        label?: string;
        value?: string;
      };
      return {
        label: raw.name ?? raw.label ?? '',
        value: raw.description ?? raw.value ?? '',
      };
    }),
  );
  const [notes, setNotes] = useState<string>(token.notes ?? "");
  const update = useTokenUpdate(sceneId, worldId);
  // 16.2g F2 — world-scoped token schéma (Vlastní Systém) pro sanitizaci klíčů.
  const tokenSchema = useResolvedEntitySchema(worldId, systemId, "token");

  const handleSave = (): void => {
    // Sanitizace systemStats na klíče známé schématu. BE `validateForPatch` je
    // STRICT — odmítne neznámý klíč. Starší tokeny mají v systemStats legacy
    // smetí (zaseknuté `abilities`, odebrané `health.base`) → bez filtru by save
    // spadl na „Unknown field". Filtr drží jen pole z `<system>:token` schématu.
    const knownKeys = new Set(
      tokenSchema?.sections.flatMap((s) => s.fields.map((f) => f.key)) ?? [],
    );
    const cleanStats =
      knownKeys.size > 0
        ? Object.fromEntries(
            Object.entries(stats).filter(([k]) => knownKeys.has(k)),
          )
        : stats;

    update.mutate(
      {
        tokenId: token.id,
        patch: {
          systemStats: cleanStats,
          // Zpět na token tvar {name,description}; prázdné řádky vyhoď.
          abilities: abilities
            .filter((a) => a.label.trim())
            .map((a) => ({ name: a.label.trim(), description: a.value })),
          notes,
        },
      },
      {
        onSuccess: () => toast.success("Statblok uložen"),
        onError: (e) =>
          toast.error(
            `Save selhal: ${e instanceof Error ? e.message : "neznámá chyba"}`,
          ),
      },
    );
  };

  const handleInitiativeRoll = (): void => {
    const initBase =
      Number(stats["initiative.base"] ?? token.initiativeBase ?? 0) || 0;
    const rollerName = token.instanceName ?? "Bestie";
    const res = performSheetRoll({
      label: "Iniciativa",
      modifier: initBase,
      kind: "fate",
      rollerName,
    });
    // 10.2f — propsat hod do token.initiative (iniciativní lišta řadí dle něj)
    // + lokální statbar („Init aktuální"). systemStats se uloží zvlášť přes
    // „Uložit statblok"; initiative jde do tokenu hned.
    if (res) {
      // 10.2j Task H — hod do map dice systému (overlay + map log).
      onMapRoll?.({
        category: "initiative",
        dicePayload: res.dicePayload,
        tokenId: token.id,
        rollerKind: "bestie",
        rollerName,
      });
      // 10.2j — skipInvalidate: běží paralelně s `dice.roll` (onMapRoll výš).
      // Bez toho invalidate refetch sestřelí ještě nepersistovaný hod z logu.
      update.mutate({
        tokenId: token.id,
        patch: { initiative: res.total },
        skipInvalidate: true,
      });
      setStats((s) => ({ ...s, "initiative.current": res.total }));
    }
  };

  // Klik na schopnost → roll (parita se starým Matrixem). Hodnota schopnosti
  // = modifikátor, 4dF (Matrix). Stejný flow jako iniciativa.
  const handleAbilityRoll = (ability: {
    label: string;
    value: string;
  }): void => {
    const rollerName = token.instanceName ?? "Bestie";
    const res = performSheetRoll({
      label: ability.label,
      modifier: parseInt(ability.value, 10) || 0,
      kind: "fate",
      rollerName,
    });
    // 10.2j Task H — hod do map dice systému (overlay + map log).
    if (res) {
      onMapRoll?.({
        category: "skill",
        dicePayload: res.dicePayload,
        tokenId: token.id,
        rollerKind: "bestie",
        rollerName,
      });
    }
  };

  return (
    <div className={styles.bestieWrap}>
      <BestieStatblock
        token={token}
        worldId={worldId}
        systemId={systemId}
        canEdit={canEdit}
        stats={stats}
        onStatsChange={setStats}
        abilities={abilities}
        onAbilitiesChange={setAbilities}
        notes={notes}
        onNotesChange={setNotes}
        disabled={update.isPending}
        onRollAbility={handleAbilityRoll}
      />

      {canEdit && (
        <div className={styles.bestieActions}>
          <button
            type="button"
            className={styles.bestieRollBtn}
            onClick={handleInitiativeRoll}
            disabled={update.isPending}
            title="Hodit iniciativu (4dF + base)"
          >
            ⚡ + Iniciativa
          </button>
          <button
            type="button"
            className={styles.bestieSaveBtn}
            onClick={handleSave}
            disabled={update.isPending}
          >
            {update.isPending ? "Ukládám…" : "💾 Uložit statblok"}
          </button>
        </div>
      )}
    </div>
  );
}
