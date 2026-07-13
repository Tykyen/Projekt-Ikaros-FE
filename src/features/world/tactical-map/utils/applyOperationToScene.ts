/**
 * 10.2c — pure patcher pro lokální `MapScene` state.
 *
 * Mirror BE `MapOperationsService.applyAtomic` logiky (10.2-prep-1) —
 * stejná transformace, jen na in-memory objektu místo Mongo updateOne.
 *
 * Konzument: `useMapScene` na WS `map:operation` event nebo na catch-up
 * GET /operations replay. Klient drží `lastSeqNumber` pro detekci gap.
 *
 * Pure: ne-mutuje původní scene. Vrací nový objekt (shallow copy s patched
 * field). Pro React Query immutability + cheap referenční change detect.
 *
 * Spec: docs/arch/phase-10/spec-10.2c.md §3.3.
 */
import type {
  MapScene,
  MapOperation,
  MapToken,
  MapEffect,
  MapSceneNpc,
  HexCoord,
  CombatState,
  MapDiceRoll,
  ScenePlayerState,
} from '../types';

/**
 * Aplikuje operaci na scénu. Vrací nový `MapScene` objekt. Pokud op
 * referencuje neexistující entity (token/effect/template) → silent skip
 * + console.warn (typicky catch-up race; klient by měl detekovat gap a
 * refetch full scene).
 */
export function applyOperationToScene(
  scene: MapScene,
  op: MapOperation,
): MapScene {
  switch (op.type) {
    // ─── Token ops ────────────────────────────────────────────────────
    case 'token.add':
      return { ...scene, tokens: [...scene.tokens, op.token] };

    case 'token.move': {
      const idx = scene.tokens.findIndex((t) => t.id === op.tokenId);
      if (idx === -1) {
        warnUnknown('token.move', op.tokenId);
        return scene;
      }
      const updated = [...scene.tokens];
      updated[idx] = { ...updated[idx], q: op.q, r: op.r };
      return { ...scene, tokens: updated };
    }

    case 'token.remove':
      return {
        ...scene,
        tokens: scene.tokens.filter((t) => t.id !== op.tokenId),
      };

    case 'token.update': {
      const idx = scene.tokens.findIndex((t) => t.id === op.tokenId);
      if (idx === -1) {
        warnUnknown('token.update', op.tokenId);
        return scene;
      }
      const updated = [...scene.tokens];
      updated[idx] = { ...updated[idx], ...(op.patch as Partial<MapToken>) };
      return { ...scene, tokens: updated };
    }

    // ─── Effect ops ───────────────────────────────────────────────────
    case 'effect.add':
      // Idempotentní (dedup podle id): FE dělá optimistic effect.add, pak
      // dorazí WS broadcast TÉŽE op se stejným id → bez dedupu by efekt byl
      // v cache 2×. Pokud id už existuje, nahraď (broadcast verze je
      // autoritativní), jinak připoj.
      if (scene.effects.some((e) => e.id === op.effect.id)) {
        return {
          ...scene,
          effects: scene.effects.map((e) =>
            e.id === op.effect.id ? op.effect : e,
          ),
        };
      }
      return { ...scene, effects: [...scene.effects, op.effect] };

    case 'effect.remove':
      return {
        ...scene,
        effects: scene.effects.filter((e) => e.id !== op.effectId),
      };

    case 'effect.update': {
      const idx = scene.effects.findIndex((e) => e.id === op.effectId);
      if (idx === -1) {
        warnUnknown('effect.update', op.effectId);
        return scene;
      }
      const updated = [...scene.effects];
      updated[idx] = { ...updated[idx], ...(op.patch as Partial<MapEffect>) };
      return { ...scene, effects: updated };
    }

    // ─── Drawing ops (15.4) ──────────────────────────────────────────
    case 'drawing.add': {
      // Idempotentní (dedup podle id): optimistic + WS broadcast téže op.
      const drawings = scene.drawings ?? [];
      if (drawings.some((d) => d.id === op.drawing.id)) {
        return {
          ...scene,
          drawings: drawings.map((d) =>
            d.id === op.drawing.id ? op.drawing : d,
          ),
        };
      }
      return { ...scene, drawings: [...drawings, op.drawing] };
    }

    case 'drawing.remove':
      return {
        ...scene,
        drawings: (scene.drawings ?? []).filter((d) => d.id !== op.drawingId),
      };

    case 'drawing.clear':
      return { ...scene, drawings: [] };

    // ─── Fog ops ──────────────────────────────────────────────────────
    case 'fog.set':
      return {
        ...scene,
        fogEnabled: op.enabled,
        revealedHexes: op.revealedHexes,
      };

    case 'fog.brush': {
      if (op.mode === 'reveal') {
        // $addToSet — přidej hexy, které tam ještě nejsou
        const existing = new Set(
          scene.revealedHexes.map((h) => `${h.q},${h.r}`),
        );
        const additions: HexCoord[] = [];
        for (const h of op.hexes) {
          const key = `${h.q},${h.r}`;
          if (!existing.has(key)) {
            existing.add(key);
            additions.push(h);
          }
        }
        return {
          ...scene,
          revealedHexes: [...scene.revealedHexes, ...additions],
        };
      } else {
        // $pullAll — odeber hexy, které tam jsou
        const toRemove = new Set(op.hexes.map((h) => `${h.q},${h.r}`));
        return {
          ...scene,
          revealedHexes: scene.revealedHexes.filter(
            (h) => !toRemove.has(`${h.q},${h.r}`),
          ),
        };
      }
    }

    // ─── Scene state ops ──────────────────────────────────────────────
    case 'scene.state': {
      const next = { ...scene };
      if (op.isHidden !== undefined) next.isHidden = op.isHidden;
      if (op.isLocked !== undefined) next.isLocked = op.isLocked;
      return next;
    }

    // 10.2n — per-hráč override. Merge nad existujícím entry; `null` smaže pole,
    // `undefined` nechá beze změny. Prázdný entry se vyřadí. Mirror BE applyAtomic.
    case 'scene.playerState': {
      const existing = scene.playerStates?.find((p) => p.userId === op.userId);
      const merged: ScenePlayerState = { userId: op.userId };
      if (existing?.isHidden !== undefined) merged.isHidden = existing.isHidden;
      if (existing?.isLocked !== undefined) merged.isLocked = existing.isLocked;
      if (op.isHidden === null) delete merged.isHidden;
      else if (op.isHidden !== undefined) merged.isHidden = op.isHidden;
      if (op.isLocked === null) delete merged.isLocked;
      else if (op.isLocked !== undefined) merged.isLocked = op.isLocked;
      const others = (scene.playerStates ?? []).filter(
        (p) => p.userId !== op.userId,
      );
      const hasOverride =
        merged.isHidden !== undefined || merged.isLocked !== undefined;
      return {
        ...scene,
        playerStates: hasOverride ? [...others, merged] : others,
      };
    }

    case 'scene.config':
      return { ...scene, config: op.config };

    case 'scene.image':
      return { ...scene, imageUrl: op.imageUrl };

    case 'scene.name':
      return { ...scene, name: op.name };

    case 'scene.folder':
      return { ...scene, folder: op.folder ?? undefined };

    // 10.2c-edit-1
    case 'scene.deactivate':
      return { ...scene, isActive: false };

    // D-DROBNE-UNDO — inverse scene.deactivate (mirror BE CAS isActive=true)
    case 'scene.activate':
      return { ...scene, isActive: true };

    // 10.2c-edit-2 — load template sekvence
    case 'scene.fog.replace':
      return {
        ...scene,
        fogEnabled: op.fogEnabled,
        revealedHexes: op.revealedHexes,
      };

    case 'scene.effects.replace':
      return { ...scene, effects: op.effects };

    // 17.2 — import UVTT: nahrazení zdí/světel
    case 'scene.walls.replace':
      return { ...scene, walls: op.walls };

    case 'scene.lights.replace':
      return { ...scene, lights: op.lights };

    case 'scene.npc-templates.replace':
      return { ...scene, npcTemplates: op.npcTemplates };

    case 'scene.tokens.replace-npc': {
      // Zachová PC tokeny (isNpc=false), nahradí NPC payload tokeny
      const pcTokens = scene.tokens.filter((t) => !t.isNpc);
      const payloadNpc = op.tokens.filter((t) => t.isNpc);
      return { ...scene, tokens: [...pcTokens, ...payloadNpc] };
    }

    // D-DROBNE-UNDO — bulk replace kreseb (inverse drawing.clear); mirror BE $set
    case 'scene.drawings.replace':
      return { ...scene, drawings: op.drawings };

    case 'scene.sounds.set':
      return { ...scene, activeSoundIds: op.activeSoundIds };

    // 10.2c-edit-7 — vyčistit scénu od všech tokenů + ukončit combat
    case 'scene.tokens.clear':
      return { ...scene, tokens: [], combat: null };

    // 10.2c-edit-7 — universal replace tokenů (inverse pro clear/restore)
    case 'scene.tokens.replace':
      return {
        ...scene,
        tokens: op.tokens,
        ...(op.combat !== undefined ? { combat: op.combat } : {}),
      };

    // 10.2c-edit-7 — per-scéna whitelist Character.id (idempotent add/remove)
    case 'scene.activeCharacters.add': {
      if (scene.activeCharacterIds.includes(op.characterId)) return scene;
      return {
        ...scene,
        activeCharacterIds: [...scene.activeCharacterIds, op.characterId],
      };
    }

    case 'scene.activeCharacters.remove':
      return {
        ...scene,
        activeCharacterIds: scene.activeCharacterIds.filter(
          (id) => id !== op.characterId,
        ),
      };

    // 10.2c-edit-7 — per-scéna whitelist Bestie.id
    case 'scene.activeBestie.add': {
      if (scene.activeBestieIds.includes(op.bestieId)) return scene;
      return {
        ...scene,
        activeBestieIds: [...scene.activeBestieIds, op.bestieId],
      };
    }

    case 'scene.activeBestie.remove':
      return {
        ...scene,
        activeBestieIds: scene.activeBestieIds.filter(
          (id) => id !== op.bestieId,
        ),
      };

    // ─── Sound ops ────────────────────────────────────────────────────
    // 10.2k — runtime ambient playlist (BE mapuje soundIds → activeSoundIds;
    // FE patcher musí zrcadlit).
    case 'sound.playlist':
      return { ...scene, activeSoundIds: op.soundIds };

    // ─── Combat ops ───────────────────────────────────────────────────
    case 'combat.start':
      return {
        ...scene,
        combat: {
          isActive: true,
          round: 1,
          currentTokenId: op.orderTokenIds[0] ?? null,
          order: op.orderTokenIds,
          endOfTurnEffects: [],
          startedAt: new Date().toISOString(),
        },
      };

    case 'combat.turn': {
      const combat = scene.combat;
      if (!combat?.isActive) {
        warnUnknown('combat.turn', 'inactive combat');
        return scene;
      }
      let nextTokenId: string | null = op.tokenId ?? null;
      // 10.2f — `round` override (FE řídí pořadí při živém sortu). Bez něj
      // legacy auto-next dle order (BC).
      let nextRound = op.round ?? combat.round;
      if (!nextTokenId) {
        // next in order; po posledním → round++
        const currentIdx = combat.order.indexOf(combat.currentTokenId ?? '');
        const nextIdx = (currentIdx + 1) % combat.order.length;
        nextTokenId = combat.order[nextIdx] ?? null;
        if (op.round === undefined && nextIdx === 0) nextRound++;
      }
      return {
        ...scene,
        combat: {
          ...combat,
          currentTokenId: nextTokenId,
          round: nextRound,
        },
      };
    }

    case 'combat.end':
      return { ...scene, combat: null };

    case 'combat.reorder': {
      // 10.2f-2 — přepíše jen order; round + currentTokenId beze změny.
      const combat = scene.combat;
      if (!combat?.isActive) {
        warnUnknown('combat.reorder', 'inactive combat');
        return scene;
      }
      return {
        ...scene,
        combat: { ...combat, order: op.orderTokenIds },
      };
    }

    case 'combat.effect.add': {
      if (!scene.combat?.isActive) {
        warnUnknown('combat.effect.add', 'inactive combat');
        return scene;
      }
      // op.effect je Record<string, unknown> — caster bere FE odpovědnost.
      const newEffect = op.effect as unknown as CombatState['endOfTurnEffects'][number];
      return {
        ...scene,
        combat: {
          ...scene.combat,
          endOfTurnEffects: [...scene.combat.endOfTurnEffects, newEffect],
        },
      };
    }

    case 'combat.effect.remove': {
      if (!scene.combat?.isActive) return scene;
      return {
        ...scene,
        combat: {
          ...scene.combat,
          endOfTurnEffects: scene.combat.endOfTurnEffects.filter(
            (e) => e.id !== op.effectId,
          ),
        },
      };
    }

    // ─── NPC template ops ─────────────────────────────────────────────
    case 'npcTemplate.add':
      return { ...scene, npcTemplates: [...scene.npcTemplates, op.template] };

    case 'npcTemplate.remove':
      // Cascade — smaž template + všechny tokeny instancované z ní (matchuje
      // BE atomic cascade z 10.2-prep-1 C5).
      return {
        ...scene,
        npcTemplates: scene.npcTemplates.filter(
          (n) => n.id !== op.templateId,
        ),
        tokens: scene.tokens.filter((t) => t.templateId !== op.templateId),
      };

    case 'npcTemplate.update': {
      const idx = scene.npcTemplates.findIndex(
        (n) => n.id === op.templateId,
      );
      if (idx === -1) {
        warnUnknown('npcTemplate.update', op.templateId);
        return scene;
      }
      const updated = [...scene.npcTemplates];
      updated[idx] = {
        ...updated[idx],
        ...(op.patch as Partial<MapSceneNpc>),
      };
      return { ...scene, npcTemplates: updated };
    }

    // ─── Dice ops ─────────────────────────────────────────────────────
    case 'dice.roll': {
      const current = scene.diceRolls ?? [];
      // Idempotent dedup (optimistic + WS broadcast téže op se stejným id).
      if (current.some((d: MapDiceRoll) => d.id === op.roll.id)) {
        return scene;
      }
      const next = [...current, op.roll];
      if (next.length > 50) next.splice(0, next.length - 50);
      return { ...scene, diceRolls: next };
    }

    default: {
      // Exhaustive check — pokud BE přidá nový op type bez FE update, TS catch.
      const _exhaustive: never = op;
      void _exhaustive;
      return scene;
    }
  }
}

function warnUnknown(opType: string, ref: string): void {
  console.warn(
    `[applyOperationToScene] ${opType} references unknown entity "${ref}". ` +
      'Possible catch-up race — klient by měl detekovat seqNumber gap a refetch.',
  );
}
