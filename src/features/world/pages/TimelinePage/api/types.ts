import type { LunarPhase } from '@/shared/lib/calendarEngine';

/**
 * 9.3 — typy pro Timeline API (mirror BE `timeline` module).
 */

export interface CelestialOverride {
  bodyId: string;
  phase: LunarPhase;
}

export interface CelestialState {
  bodyId: string;
  name: string;
  phase: LunarPhase;
  color: string;
  isManualOverride: boolean;
}

export interface TimelineEvent {
  id: string;
  worldId: string;
  year: number;
  month: number; // 1-based
  day: number; // 1-based
  hour: number | null;
  title: string;
  text: string;
  imageUrl: string | null;
  imageFocalX: number | null;
  imageFocalY: number | null;
  link: string | null;
  pageSlug: string | null;
  celestialOverrides: CelestialOverride[];
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEventResponse extends TimelineEvent {
  celestialStates: CelestialState[];
}

export interface TimelineEventsPage {
  events: TimelineEventResponse[];
  /** Opaque cursor pro další stránku, nebo `null` pokud žádná. */
  nextCursor: string | null;
}

export interface TimelineYearCount {
  year: number;
  count: number;
}

export type TimelineSort = 'asc' | 'desc';

// ── DTOs ──────────────────────────────────────────────────────────────────

export interface CreateTimelineEventDto {
  worldId: string;
  year: number;
  month: number;
  day: number;
  hour?: number | null;
  title: string;
  text: string;
  imageUrl?: string | null;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  link?: string | null;
  pageSlug?: string | null;
  celestialOverrides?: CelestialOverride[];
}

export interface UpdateTimelineEventDto {
  year?: number;
  month?: number;
  day?: number;
  hour?: number | null;
  title?: string;
  text?: string;
  /** `null` v body = "zachovat stávající" (mirror BE imageUrl null semantics). */
  imageUrl?: string | null;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  link?: string | null;
  pageSlug?: string | null;
  celestialOverrides?: CelestialOverride[];
}

export interface TimelineFilters {
  fromYear?: number;
  toYear?: number;
  search?: string;
  sort?: TimelineSort;
}
