import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';
import { WorldRole, type GameEvent, type UpcomingEventDto } from '@/shared/types';
import { activeWindowCutoffIso } from '@/features/world/utils/relativeCountdown';

// ── 9.1-I — DTO typy pro mutations ───────────────────────────────────────
export interface CreateGameEventDto {
  worldId: string;
  title: string;
  date: string;
  description?: string;
  imageUrl?: string | null;
  imageFocalX?: number;
  imageFocalY?: number;
  imageZoom?: number;
  imageFit?: 'cover' | 'contain';
  targetGroup?: string | null;
  groupOnly?: boolean;
  confirmable?: boolean;
}

export interface UpdateGameEventDto {
  title?: string;
  date?: string;
  description?: string;
  imageUrl?: string | null;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: 'cover' | 'contain' | null;
  targetGroup?: string | null;
  groupOnly?: boolean;
  confirmable?: boolean;
}

export function useUpcomingEventsMine(opts: { limit?: number } = {}) {
  const token = useAtomValue(accessTokenAtom);
  const limit = opts.limit ?? 5;
  return useQuery({
    queryKey: ['game-events', 'upcoming-mine', limit],
    queryFn: () =>
      api.get<UpcomingEventDto[]>(`/game-events/upcoming/mine?limit=${limit}`),
    enabled: !!token,
    staleTime: 60_000,
    placeholderData: [],
  });
}

/**
 * 5.2 — nadcházející herní akce světa (`GET /game-events?worldId=`).
 * `fromDate` = dnešní půlnoc → vrací jen budoucí akce.
 */
export function useWorldGameEvents(worldId: string, limit = 10) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: ['game-events', 'world', worldId, limit],
    queryFn: () => {
      const now = new Date();
      const fromDate =
        `${now.getFullYear()}-` +
        `${String(now.getMonth() + 1).padStart(2, '0')}-` +
        `${String(now.getDate()).padStart(2, '0')}T00:00`;
      return api.get<GameEvent[]>(
        `/game-events?worldId=${worldId}&limit=${limit}&fromDate=${fromDate}`,
      );
    },
    enabled: !!token && !!worldId,
    staleTime: 60_000,
    placeholderData: [],
  });
}

/**
 * 5.5c — všechny herní akce světa (minulé i budoucí) pro kalendář.
 * Bez `fromDate` → BE vrací vše; `limit` 500 (světy mají desítky akcí).
 */
export function useAllWorldGameEvents(worldId: string, limit = 500) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: ['game-events', 'world-all', worldId, limit],
    queryFn: () =>
      api.get<GameEvent[]>(
        `/game-events?worldId=${worldId}&limit=${limit}`,
      ),
    enabled: !!token && !!worldId,
    staleTime: 60_000,
    placeholderData: [],
  });
}

export function useToggleRsvp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) =>
      api.post<void>(`/game-events/${eventId}/confirm`),
    onSuccess: (_, eventId) => {
      qc.invalidateQueries({ queryKey: ['game-events', 'upcoming-mine'] });
      qc.invalidateQueries({ queryKey: ['game-events', 'upcoming-world'] });
      qc.invalidateQueries({ queryKey: ['game-events', 'archive-world'] });
      // 9.1-I — invalidate i existing dashboard query (5.2)
      qc.invalidateQueries({ queryKey: ['game-events', 'world'] });
      void eventId;
    },
  });
}

// ─── 9.1-I — světová stránka /svet/:slug/akce ────────────────────────────

/** Nadcházející akce světa (`date ≥ now − 24h`). Pro hráče BE auto-clamp. */
export function useUpcomingGameEvents(worldId: string) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: ['game-events', 'upcoming-world', worldId],
    queryFn: () => {
      const cutoff = activeWindowCutoffIso();
      return api.get<GameEvent[]>(
        `/game-events?worldId=${encodeURIComponent(worldId)}&fromDate=${encodeURIComponent(cutoff)}&limit=200`,
      );
    },
    enabled: !!token && !!worldId,
    staleTime: 30_000,
    placeholderData: [],
  });
}

/**
 * Archivní akce světa (`date < now − 24h`). Vidí jen `PomocnyPJ+`.
 * Pro `Hrac` BE vrátí 403 `ARCHIVE_PJ_ONLY`; FE proto query disable přes `enabled`.
 */
export function useArchiveGameEvents(worldId: string, viewerRole: WorldRole) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: ['game-events', 'archive-world', worldId],
    queryFn: () => {
      const cutoff = activeWindowCutoffIso();
      return api.get<GameEvent[]>(
        `/game-events?worldId=${encodeURIComponent(worldId)}&toDate=${encodeURIComponent(cutoff)}&limit=200`,
      );
    },
    enabled: !!token && !!worldId && viewerRole >= WorldRole.PomocnyPJ,
    staleTime: 30_000,
    placeholderData: [],
  });
}

function invalidateGameEvents(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['game-events', 'upcoming-world'] });
  qc.invalidateQueries({ queryKey: ['game-events', 'archive-world'] });
  qc.invalidateQueries({ queryKey: ['game-events', 'upcoming-mine'] });
  qc.invalidateQueries({ queryKey: ['game-events', 'world'] });
  qc.invalidateQueries({ queryKey: ['game-events', 'world-all'] });
}

export function useCreateGameEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateGameEventDto) =>
      api.post<GameEvent>('/game-events', dto),
    onSuccess: () => invalidateGameEvents(qc),
  });
}

export function useUpdateGameEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateGameEventDto }) =>
      api.put<GameEvent>(`/game-events/${id}`, dto),
    onSuccess: () => invalidateGameEvents(qc),
  });
}

export function useDeleteGameEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/game-events/${id}`),
    onSuccess: () => invalidateGameEvents(qc),
  });
}

// ─── 9.1-II — komentáře u game events ─────────────────────────────────────

/**
 * 9.1-II — detail eventu s plnými `comments[]` (lazy fetch na expand).
 * BE `GET /:id` vrací full event vč. comments; samostatný `/comments`
 * endpoint nepoužíváme.
 */
export function useGameEventDetail(eventId: string, enabled: boolean) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: ['game-events', 'detail', eventId],
    queryFn: () => api.get<GameEvent>(`/game-events/${eventId}`),
    enabled: !!token && !!eventId && enabled,
    staleTime: 10_000,
  });
}

function invalidateComments(
  qc: ReturnType<typeof useQueryClient>,
  eventId: string,
) {
  qc.invalidateQueries({ queryKey: ['game-events', 'detail', eventId] });
  qc.invalidateQueries({ queryKey: ['game-events', 'upcoming-world'] });
  qc.invalidateQueries({ queryKey: ['game-events', 'archive-world'] });
}

export interface AddCommentInput {
  content: string;
  parentId?: string | null;
}

export function useAddComment(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddCommentInput) =>
      api.post<GameEvent>(`/game-events/${eventId}/comments`, {
        content: input.content,
        ...(input.parentId ? { parentId: input.parentId } : {}),
      }),
    onSuccess: () => invalidateComments(qc, eventId),
  });
}

export function useEditComment(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      commentId,
      content,
    }: {
      commentId: string;
      content: string;
    }) =>
      api.patch<GameEvent>(
        `/game-events/${eventId}/comments/${commentId}`,
        { content },
      ),
    onSuccess: () => invalidateComments(qc, eventId),
  });
}

export function useDeleteComment(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) =>
      api.delete<GameEvent>(`/game-events/${eventId}/comments/${commentId}`),
    onSuccess: () => invalidateComments(qc, eventId),
  });
}

export function useReactToComment(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      commentId,
      emoji,
    }: {
      commentId: string;
      emoji: string;
    }) =>
      api.post<GameEvent>(
        `/game-events/${eventId}/comments/${commentId}/react`,
        { emoji },
      ),
    onSuccess: () => invalidateComments(qc, eventId),
  });
}
