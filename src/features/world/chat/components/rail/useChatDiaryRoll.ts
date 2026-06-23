import { useCallback } from 'react';
import { toast } from 'sonner';
import type { SystemSheetProps } from '@/features/world/pages/CharacterDetailPage/diary-systems/types';
import { useSendMessage } from '../../api/useWorldChat';
import { useDiceRollOverlay } from '../../dice/components/DiceRollOverlayProvider';
import { useDiceSkinMapping } from '../../dice/api/useDiceSkinMapping';
import { rollDiaryRequest } from '../../dice/lib/rollFromDiary';

/**
 * 16.1a — most hodu z deníku do světového chatu.
 *
 * Atribuce (spec R1): kdo „mluví" za hod.
 *   - `self`  — hráč za svou postavu (bez override; jeho persona).
 *   - `pj`    — PJ za hráče (bez override; render-time „PJ").
 *   - `npc`   — PJ za NPC (override jméno+avatar+slug). [16.1b]
 *   - `bestie`— PJ za bestii (override jméno+avatar). [16.1c]
 */
export type RollAttribution =
  | { kind: 'self' | 'pj'; rollerName: string }
  | { kind: 'npc'; rollerName: string; avatarUrl?: string; slug?: string }
  | { kind: 'bestie'; rollerName: string; avatarUrl?: string };

type OverrideFields = Pick<
  import('../../api/useWorldChat').SendWorldMessagePayload,
  'overrideName' | 'overrideAvatarUrl' | 'overridePageSlug'
>;

function attributionOverride(att: RollAttribution): OverrideFields {
  switch (att.kind) {
    case 'npc':
      return {
        overrideName: att.rollerName,
        overrideAvatarUrl: att.avatarUrl,
        overridePageSlug: att.slug,
      };
    case 'bestie':
      return {
        overrideName: att.rollerName,
        overrideAvatarUrl: att.avatarUrl,
      };
    default:
      return {};
  }
}

/**
 * Vrací továrnu `makeOnRoll(attribution)` → `onRoll` pro deníkový sheet.
 * Klik na schopnost: hod → 3D overlay → po doběhnutí pošle zprávu do
 * konverzace (content + dicePayload + skin + override dle atribuce).
 */
export function useChatDiaryRoll(worldId: string, channelId: string | null) {
  const sendMessage = useSendMessage(worldId, channelId ?? '');
  const overlay = useDiceRollOverlay();
  const { getSkin } = useDiceSkinMapping(worldId);

  return useCallback(
    (attribution: RollAttribution): NonNullable<SystemSheetProps['onRoll']> =>
      (req) => {
        if (!channelId) {
          toast.error('Nejdřív vyber konverzaci.');
          return;
        }
        const result = rollDiaryRequest(req);
        if (!result) {
          toast.error('Tento typ hodu z deníku neumím.');
          return;
        }
        const { dicePayload, content } = result;
        const skin = getSkin(dicePayload.type);
        const doSend = () =>
          sendMessage.mutate({
            content,
            dicePayload: dicePayload as unknown as Record<string, unknown>,
            diceSkin: skin ?? undefined,
            ...attributionOverride(attribution),
          });
        // Send až po doběhnutí overlay (jako composer) — ať uživatel nevidí
        // 3D overlay i 2D snapshot v historii zároveň.
        overlay.trigger(dicePayload, skin ?? null, attribution.rollerName, doSend);
      },
    [channelId, sendMessage, overlay, getSkin],
  );
}
