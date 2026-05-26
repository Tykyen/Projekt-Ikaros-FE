/**
 * 9.2b — Multi-config kalendáře per svět.
 *
 * Konzumuje BE endpoint `GET /worlds/:worldId/calendar-configs`.
 * Shape mirror `CalendarConfig` z `@/shared/lib/calendarEngine/types`.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';
import type { CalendarConfig } from '@/shared/lib/calendarEngine';

export const calendarConfigsKey = (worldId: string) =>
  ['calendar-configs', worldId] as const;

export function useCalendarConfigs(worldId: string | undefined) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: worldId ? calendarConfigsKey(worldId) : ['calendar-configs', 'noop'],
    queryFn: () =>
      api.get<CalendarConfig[]>(`/worlds/${worldId}/calendar-configs`),
    enabled: !!token && !!worldId,
    staleTime: 60_000,
  });
}

export interface CreateCalendarConfigDto {
  slug: string;
  name: string;
  hoursPerDay?: number;
  daysOfWeek?: string[];
  /** 9.3-F-II — MonthDef má volitelné `isIntercalary` pro lunisolar. */
  months?: CalendarConfig['months'];
  celestialBodies?: CalendarConfig['celestialBodies'];
  seasons?: CalendarConfig['seasons'];
  /** 9.3-F-I — opt-in leap pravidlo (every-4 / solar-hijri-33 / islamic-30). */
  leapYearRule?: CalendarConfig['leapYearRule'];
  /** 9.3-F-II — opt-in lunisolar (Metonic 19-letý cyklus). */
  lunisolar?: CalendarConfig['lunisolar'];
  epochOffset?: number;
}

export function useCreateCalendarConfig(worldId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCalendarConfigDto) =>
      api.post<CalendarConfig>(`/worlds/${worldId}/calendar-configs`, dto),
    onSuccess: () => {
      if (worldId) qc.invalidateQueries({ queryKey: calendarConfigsKey(worldId) });
    },
  });
}

export interface PatchCalendarConfigDto {
  name?: string;
  hoursPerDay?: number;
  daysOfWeek?: string[];
  months?: CalendarConfig['months'];
  celestialBodies?: CalendarConfig['celestialBodies'];
  seasons?: CalendarConfig['seasons'];
  /** 9.3-F-I — `null` = clear, undefined = beze změny. */
  leapYearRule?: CalendarConfig['leapYearRule'] | null;
  /** 9.3-F-II — `null` = clear lunisolar. */
  lunisolar?: CalendarConfig['lunisolar'] | null;
  epochOffset?: number;
}

export function useUpdateCalendarConfig(worldId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, dto }: { slug: string; dto: PatchCalendarConfigDto }) =>
      api.patch<CalendarConfig>(
        `/worlds/${worldId}/calendar-configs/${slug}`,
        dto,
      ),
    onSuccess: () => {
      if (worldId) qc.invalidateQueries({ queryKey: calendarConfigsKey(worldId) });
    },
  });
}

export function useDeleteCalendarConfig(worldId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) =>
      api.delete<void>(`/worlds/${worldId}/calendar-configs/${slug}`),
    onSuccess: () => {
      if (worldId) qc.invalidateQueries({ queryKey: calendarConfigsKey(worldId) });
    },
  });
}

export interface PatchCalendarDefaultsDto {
  defaultCalendarConfigSlug?: string;
  timelineEpoch?: number;
}

export function useUpdateCalendarDefaults(worldId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: PatchCalendarDefaultsDto) =>
      api.patch<{ id: string }>(
        `/worlds/${worldId}/calendar-defaults`,
        dto,
      ),
    onSuccess: () => {
      if (!worldId) return;
      qc.invalidateQueries({ queryKey: calendarConfigsKey(worldId) });
      // 9.3-F-II FIX (2026-05-26) — `useWorld(slug|id)` má queryKey
      // ['worlds', 'slug'|'id', key], NE singular ['world', worldId].
      // Broad invalidate, ať se ⭐ default ikona okamžitě překreslí
      // (defaultCalendarConfigSlug je field na World entitě, kterou drží useWorld).
      qc.invalidateQueries({ queryKey: ['worlds'] });
    },
  });
}
