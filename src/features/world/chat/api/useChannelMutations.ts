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

export interface CreateChannelInput {
  groupId: string;
  name: string;
  accessMode: ChannelAccessMode;
  allowedRoles?: number[];
  allowedMemberIds?: string[];
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
