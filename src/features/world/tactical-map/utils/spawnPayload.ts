/**
 * 10.2c-edit-9a — typed payload pro HTML5 dataTransfer při drag&drop
 * spawn z palety na mapu (PC / NPC / Bestie).
 *
 * MIME `application/x-ikaros-token` primary, `text/plain` fallback
 * (Safari historicky strip non-text MIME — defenzivně oba).
 *
 * Plán: docs/arch/phase-10/plan-10.2c-edit-9a.md §3.2.
 */

export const SPAWN_PAYLOAD_MIME = 'application/x-ikaros-token';

export type SpawnPayload =
  | {
      kind: 'pc';
      characterId: string;
      characterSlug: string;
      name: string;
      imageUrl?: string;
    }
  | {
      kind: 'npc';
      characterId: string;
      characterSlug: string;
      name: string;
      imageUrl?: string;
    }
  | {
      kind: 'bestie';
      bestieId: string;
      name: string;
    };

export function serializeSpawnPayload(p: SpawnPayload): string {
  return JSON.stringify(p);
}

/**
 * Defenzivní parse — vrátí `null` pro invalid JSON, neznámý `kind`,
 * nebo chybějící povinná pole. Konzument musí checkovat null.
 */
export function parseSpawnPayload(raw: string | null | undefined): SpawnPayload | null {
  if (!raw) return null;
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!obj || typeof obj !== 'object') return null;
  const kind = (obj as { kind?: unknown }).kind;
  if (kind === 'pc' || kind === 'npc') {
    const o = obj as Record<string, unknown>;
    if (typeof o.characterId !== 'string' || !o.characterId) return null;
    if (typeof o.characterSlug !== 'string') return null;
    if (typeof o.name !== 'string') return null;
    return {
      kind,
      characterId: o.characterId,
      characterSlug: o.characterSlug,
      name: o.name,
      imageUrl: typeof o.imageUrl === 'string' ? o.imageUrl : undefined,
    };
  }
  if (kind === 'bestie') {
    const o = obj as Record<string, unknown>;
    if (typeof o.bestieId !== 'string' || !o.bestieId) return null;
    if (typeof o.name !== 'string') return null;
    return { kind: 'bestie', bestieId: o.bestieId, name: o.name };
  }
  return null;
}

/**
 * Nastav payload do `DataTransfer` v `onDragStart`. Nastavuje oba MIME
 * (primary + text/plain fallback) plus `effectAllowed = 'copy'`.
 */
export function writeSpawnPayload(
  dt: DataTransfer,
  payload: SpawnPayload,
): void {
  const serialized = serializeSpawnPayload(payload);
  try {
    dt.setData(SPAWN_PAYLOAD_MIME, serialized);
  } catch {
    // Safari throw — fallback na text/plain stačí
  }
  dt.setData('text/plain', serialized);
  dt.effectAllowed = 'copy';
}

/**
 * Vyzvedne payload z `DataTransfer` v `onDrop`. Try primary MIME, fallback
 * text/plain. Vrací `null` pokud žádný validní payload.
 */
export function readSpawnPayload(dt: DataTransfer): SpawnPayload | null {
  const primary = dt.getData(SPAWN_PAYLOAD_MIME);
  const parsed = parseSpawnPayload(primary);
  if (parsed) return parsed;
  return parseSpawnPayload(dt.getData('text/plain'));
}

/**
 * Zda DataTransfer (v `onDragOver`) NESE spawn payload — typically určuje,
 * zda volat `e.preventDefault()` (= povolit drop).
 */
export function hasSpawnPayloadType(dt: DataTransfer): boolean {
  const types = Array.from(dt.types ?? []);
  return types.includes(SPAWN_PAYLOAD_MIME) || types.includes('text/plain');
}
