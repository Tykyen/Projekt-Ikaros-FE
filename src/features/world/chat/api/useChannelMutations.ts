import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { worldChatKeys } from './useWorldChat';
import type {
  ChatGroup,
  ChatChannel,
  ChannelAccessMode,
  GroupWithChannels,
} from '../lib/types';

const base = (worldId: string) => `/worlds/${worldId}/chat`;

export interface CreateGroupInput {
  name: string;
  imageUrl?: string;
  /** Krok 6.5c — preset slot `'0'..'11'`. */
  color?: string;
  /** Krok 6.5c — klíč z `GROUP_ICONS` mapy. */
  iconKey?: string;
}

/** Vytvoření kanálu (`ChatGroup`) — PJ/Pomocný PJ. */
export function useCreateGroup(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateGroupInput) =>
      api.post<ChatGroup>(`${base(worldId)}/groups`, dto),
    // C-06 — self-invalidace sidebaru (REST fallback k WS echu chat:group:*).
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: worldChatKeys(worldId).groups }),
  });
}

export interface UpdateGroupInput {
  groupId: string;
  name?: string;
  imageUrl?: string;
  /** Krok 6.5c — `'0'..'11'` (set) nebo `''` (reset na auto). */
  color?: string;
  /** Krok 6.5c — `[a-z0-9-]{1,32}` (set) nebo `''` (reset na bez ikony). */
  iconKey?: string;
}

/** Úprava kanálu (`ChatGroup`) — přejmenování, výměna obrázku. */
export function useUpdateGroup(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, ...dto }: UpdateGroupInput) =>
      api.patch<ChatGroup>(`${base(worldId)}/groups/${groupId}`, dto),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: worldChatKeys(worldId).groups }), // C-06
  });
}

/** Smazání kanálu (`ChatGroup`) — kaskáduje na konverzace + zprávy. */
export function useDeleteGroup(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) =>
      api.delete<void>(`${base(worldId)}/groups/${groupId}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: worldChatKeys(worldId).groups }), // C-06
  });
}

export interface CreateChannelInput {
  groupId: string;
  name: string;
  accessMode: ChannelAccessMode;
  allowedRoles?: number[];
  allowedMemberIds?: string[];
  imageUrl?: string;
}

/** Vytvoření konverzace (`ChatChannel`) uvnitř kanálu — PJ/Pomocný PJ. */
export function useCreateChannel(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, ...dto }: CreateChannelInput) =>
      api.post<ChatChannel>(
        `${base(worldId)}/groups/${groupId}/channels`,
        dto,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: worldChatKeys(worldId).groups }), // C-06
  });
}

export interface UpdateChannelInput {
  channelId: string;
  name?: string;
  accessMode?: ChannelAccessMode;
  allowedRoles?: number[];
  allowedMemberIds?: string[];
  imageUrl?: string;
  /** Přesun konverzace do jiného kanálu (musí být ve stejném světě). */
  groupId?: string;
}

/** Úprava konverzace (`ChatChannel`) — rename, přístup, obrázek, přesun. */
export function useUpdateChannel(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, ...dto }: UpdateChannelInput) =>
      api.patch<ChatChannel>(`${base(worldId)}/channels/${channelId}`, dto),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: worldChatKeys(worldId).groups }), // C-06
  });
}

/** Smazání konverzace (`ChatChannel`) — soft-deletuje zprávy. */
export function useDeleteChannel(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) =>
      api.delete<void>(`${base(worldId)}/channels/${channelId}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: worldChatKeys(worldId).groups }), // C-06
  });
}

/** Položka v bulk reorder payloadu. */
export interface ReorderItem {
  id: string;
  order: number;
}

/**
 * Krok 6.5a — bulk reorder kanálů světa (drag-drop v sidebaru).
 * Optimistic update lokální cache, rollback při BE chybě.
 */
export function useReorderGroups(worldId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: ReorderItem[]) =>
      api.post<void>(`${base(worldId)}/groups/reorder`, { items }),
    onMutate: async (items) => {
      const queryKey = worldChatKeys(worldId).groups;
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<GroupWithChannels[]>(queryKey);
      if (prev) {
        const orderMap = new Map(items.map((i) => [i.id, i.order]));
        const next = [...prev]
          .map((g) => ({
            ...g,
            group: {
              ...g.group,
              order: orderMap.get(g.group.id) ?? g.group.order,
            },
          }))
          .sort((a, b) => a.group.order - b.group.order);
        queryClient.setQueryData(queryKey, next);
      }
      return { prev };
    },
    onError: (_err, _items, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(worldChatKeys(worldId).groups, ctx.prev);
      }
    },
    onSettled: () => {
      // C-06 — resync server-truth pořadí (BE může order normalizovat).
      void queryClient.invalidateQueries({
        queryKey: worldChatKeys(worldId).groups,
      });
    },
  });
}

/**
 * Krok 6.5b — bulk reorder konverzací **v rámci jednoho kanálu**.
 * `groupId` = kanál, ve kterém se přerovnává; všechny `items[].id` musí do něj patřit.
 */
export function useReorderChannels(worldId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ items }: { groupId: string; items: ReorderItem[] }) =>
      api.post<void>(`${base(worldId)}/channels/reorder`, { items }),
    onMutate: async ({ groupId, items }) => {
      const queryKey = worldChatKeys(worldId).groups;
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<GroupWithChannels[]>(queryKey);
      if (prev) {
        const orderMap = new Map(items.map((i) => [i.id, i.order]));
        const next = prev.map((g) =>
          g.group.id !== groupId
            ? g
            : {
                ...g,
                channels: [...g.channels]
                  .map((c) => ({ ...c, order: orderMap.get(c.id) ?? c.order }))
                  .sort((a, b) => a.order - b.order),
              },
        );
        queryClient.setQueryData(queryKey, next);
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(worldChatKeys(worldId).groups, ctx.prev);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: worldChatKeys(worldId).groups,
      }); // C-06
    },
  });
}
