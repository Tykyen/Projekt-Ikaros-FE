/**
 * Slovní popisy 60 lokací Rozcestí — migrováno ze starého Matrixu
 * (`pages/Ikaros/descriptions/*`). Klíče `'1'`–`'20'` na styl.
 */
import FANTASY_DESCRIPTIONS from './fantasy';
import SCIFI_DESCRIPTIONS from './scifi';
import MYSTIC_DESCRIPTIONS from './mystic';
import type { RoomStyle } from '../rozcestiPlaces';

export const ROZCESTI_DESCRIPTIONS: Record<
  RoomStyle,
  Record<string, string>
> = {
  fantasy: FANTASY_DESCRIPTIONS,
  scifi: SCIFI_DESCRIPTIONS,
  mystic: MYSTIC_DESCRIPTIONS,
};

/** Popis lokace; prázdný řetězec pro neznámou kombinaci. */
export function placeDescription(style: RoomStyle, placeId: string): string {
  return ROZCESTI_DESCRIPTIONS[style]?.[placeId] ?? '';
}
