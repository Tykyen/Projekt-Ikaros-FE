/**
 * 9.2d — PJ aggregate view: postavy + NPC + Lokace v jednom poli.
 *
 * Endpoint `GET /worlds/:worldId/calendars/aggregate` (PomocnyPJ+) — viz
 * BE `calendars.service.ts`. FE filtruje per `kind` + `isNpc` ve sidebaru.
 */
import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';
import type { CalendarEvent } from '@/features/world/pages/api/characters.types';

export interface CalendarCharacterInfo {
  characterId: string;
  slug: string;
  name: string;
  color: string;
  displaySettings: {
    defaultView?: 'month' | 'week' | 'day';
    isHiddenInAggregate?: boolean;
  };
  kind: 'persona' | 'location';
  isNpc: boolean;
}

export interface AggregatedCalendarEvent extends CalendarEvent {
  characterId: string;
  slug: string;
  name: string;
  color: string;
  kind: 'persona' | 'location';
  isNpc: boolean;
}

export interface CalendarAggregateResponse {
  characters: CalendarCharacterInfo[];
  events: AggregatedCalendarEvent[];
}

export function useCalendarsAggregate(worldId: string | undefined) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: ['calendars-aggregate', worldId],
    queryFn: () =>
      api.get<CalendarAggregateResponse>(`/worlds/${worldId}/calendars/aggregate`),
    enabled: !!token && !!worldId,
    staleTime: 30_000,
  });
}
