import { useMutation } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { ChatGroup, ChatChannel, ChannelAccessMode } from '../lib/types';

const base = (worldId: string) => `/worlds/${worldId}/chat`;

/** Vytvoření kanálu (`ChatGroup`) — PJ/Pomocný PJ. */
export function useCreateGroup(worldId: string) {
  return useMutation({
    mutationFn: (dto: { name: string; imageUrl?: string }) =>
      api.post<ChatGroup>(`${base(worldId)}/groups`, dto),
  });
}

export interface UpdateGroupInput {
  groupId: string;
  name?: string;
  imageUrl?: string;
}

/** Úprava kanálu (`ChatGroup`) — přejmenování, výměna obrázku. */
export function useUpdateGroup(worldId: string) {
  return useMutation({
    mutationFn: ({ groupId, ...dto }: UpdateGroupInput) =>
      api.patch<ChatGroup>(`${base(worldId)}/groups/${groupId}`, dto),
  });
}

/** Smazání kanálu (`ChatGroup`) — kaskáduje na konverzace + zprávy. */
export function useDeleteGroup(worldId: string) {
  return useMutation({
    mutationFn: (groupId: string) =>
      api.delete<void>(`${base(worldId)}/groups/${groupId}`),
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
  return useMutation({
    mutationFn: ({ groupId, ...dto }: CreateChannelInput) =>
      api.post<ChatChannel>(
        `${base(worldId)}/groups/${groupId}/channels`,
        dto,
      ),
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
  return useMutation({
    mutationFn: ({ channelId, ...dto }: UpdateChannelInput) =>
      api.patch<ChatChannel>(`${base(worldId)}/channels/${channelId}`, dto),
  });
}

/** Smazání konverzace (`ChatChannel`) — soft-deletuje zprávy. */
export function useDeleteChannel(worldId: string) {
  return useMutation({
    mutationFn: (channelId: string) =>
      api.delete<void>(`${base(worldId)}/channels/${channelId}`),
  });
}
