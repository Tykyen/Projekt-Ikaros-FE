import type { RoomKey } from './types';

/**
 * Mapování URL segmentu (`/chat/<segment>`) na místnost Camp.
 * `camp` → I., `camp2` → II., `camp3` → III.
 */
export const CAMP_ROUTES: Record<string, { room: RoomKey; name: string }> =
  {
    camp: { room: 'camp-1', name: 'Camp I.' },
    camp2: { room: 'camp-2', name: 'Camp II.' },
    camp3: { room: 'camp-3', name: 'Camp III.' },
  };

/** Místnost dle URL segmentu; `undefined` pro neznámý segment. */
export function resolveCampRoom(
  segment: string | undefined,
): { room: RoomKey; name: string } | undefined {
  return segment ? CAMP_ROUTES[segment] : undefined;
}
