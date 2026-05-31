/**
 * 10.2i — sdílený catch-up: dotáhne zmeškané operace scény od `fromSeq`
 * a aplikuje je v pořadí. Používá ho jak gap-detection v `onOperation`
 * (incoming seqNumber > lastSeen+1), tak forced catch-up po WS reconnectu.
 *
 * `'too-big'` = gap je větší než `limit` (server vrátil plnou stránku) →
 * caller má udělat full refetch místo částečné aplikace (jinak by se tvářil
 * synchronní, ač aplikoval jen výřez).
 */
import { getMapOperationsSince } from "../api/mapApi";
import { applyOperationToScene } from "./applyOperationToScene";
import type { MapScene } from "../types";

export async function catchUpScene(
  scene: MapScene,
  fromSeq: number,
  limit = 500,
): Promise<MapScene | "too-big"> {
  const list = await getMapOperationsSince(scene.id, fromSeq, limit);

  // Plná stránka → možná chybí ještě další za hranicí → radši full refetch.
  if (list.operations.length >= limit) return "too-big";

  let working = scene;
  for (const entry of list.operations) {
    working = applyOperationToScene(working, entry.op);
  }
  return { ...working, lastSeqNumber: list.lastSeqNumber };
}
