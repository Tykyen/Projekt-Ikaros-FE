import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

/**
 * Krok 6.2f — per-svět vzhled mé zprávy v chatu (barva + font).
 *
 * Hodnoty žijí v `WorldMembership.chatColor` / `chatFont`. `null` znamená
 * „použij globální default" (color → `User.chatColor`, font → system).
 */

export interface MembershipAppearance {
  chatColor: string | null;
  chatFont: string | null;
  chatFontSize: string | null;
  /** 16.1d — per-svět skin chatu (= motiv světa; null = auto dle světa). */
  chatSkin: string | null;
  /** Krok 6.3e — per-svět volba skinu kostek per typ. */
  diceSkinMapping: Record<string, string> | null;
  /** Krok 6.3 D-NEW-dice-jail — uvězněné skiny (skryté z hlavního gridu). */
  jailedDiceSkins: string[];
}

const appearanceKey = (worldId: string) =>
  ['world-chat', worldId, 'appearance'] as const;

export function useMembershipAppearance(worldId: string) {
  return useQuery({
    queryKey: appearanceKey(worldId),
    queryFn: () =>
      api.get<MembershipAppearance>(`/worlds/${worldId}/chat/appearance`),
    enabled: !!worldId,
    staleTime: 60_000,
  });
}

export interface UpdateAppearancePayload {
  chatColor?: string | null;
  chatFont?: string | null;
  chatFontSize?: string | null;
  /** 16.1d — skin chatu (světový ThemeId; null = auto). */
  chatSkin?: string | null;
  diceSkinMapping?: Record<string, string> | null;
  jailedDiceSkins?: string[];
}

export function useUpdateAppearance(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateAppearancePayload) =>
      api.patch<MembershipAppearance>(
        `/worlds/${worldId}/chat/appearance`,
        dto,
      ),
    onSuccess: (data) => {
      qc.setQueryData(appearanceKey(worldId), data);
    },
  });
}
