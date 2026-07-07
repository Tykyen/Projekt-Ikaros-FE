/**
 * 17.11 P3 — most mezi pop-out oknem karty a hlavním oknem mapy.
 *
 * Pop-out okno (`TokenCardPopoutPage`) je separátní document → nesdílí React
 * strom ani jotai. Hod z karty v okně se přes `BroadcastChannel` pošle do
 * hlavního okna, kde `TacticalMapView` poslouchá a spustí 3D overlay + zápis do
 * map dice logu (`mapDice.roll`). Kanál je per-svět, ať se hody nemíchají.
 */
import type { MapRollRequest } from './hooks/useMapDiceRoll';

export function mapRollChannelName(worldId: string): string {
  return `ikaros-map-roll-${worldId}`;
}

export interface MapRollMessage {
  type: 'map-roll';
  payload: MapRollRequest;
}
