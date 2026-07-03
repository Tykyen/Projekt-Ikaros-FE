import type { RoomKey } from './types';

/**
 * Mapování URL segmentu (`/chat/<segment>`) na místnost Rozcestí.
 * `rozcesti` → I., `rozcesti2` → II., `rozcesti3` → III.
 */
export const ROZCESTI_ROUTES: Record<string, { room: RoomKey; name: string }> =
  {
    rozcesti: { room: 'rozcesti-1', name: 'Rozcestí I.' },
    rozcesti2: { room: 'rozcesti-2', name: 'Rozcestí II.' },
    rozcesti3: { room: 'rozcesti-3', name: 'Rozcestí III.' },
  };

/** Místnost dle URL segmentu; `undefined` pro neznámý segment. */
export function resolveRozcestiRoom(
  segment: string | undefined,
): { room: RoomKey; name: string } | undefined {
  return segment ? ROZCESTI_ROUTES[segment] : undefined;
}
