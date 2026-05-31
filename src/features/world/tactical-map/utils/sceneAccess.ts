/**
 * 10.2n — efektivní přístupový stav hráče na scéně.
 *
 * Per-hráč override (`scene.playerStates`) má přednost před per-scéna defaultem
 * (`scene.isHidden` / `scene.isLocked`). PJ tyto funkce neřeší — vidí/ovládá vždy
 * (gating PJ probíhá zvlášť). BE `OperationsAuthorizer` je autoritativní; tohle
 * je klientský mirror pro UX (overlay, drag gate).
 */
import type { MapScene } from '../types';

export function effectiveHidden(scene: MapScene, userId: string): boolean {
  return (
    scene.playerStates?.find((p) => p.userId === userId)?.isHidden ??
    scene.isHidden
  );
}

export function effectiveLocked(scene: MapScene, userId: string): boolean {
  return (
    scene.playerStates?.find((p) => p.userId === userId)?.isLocked ??
    scene.isLocked
  );
}
