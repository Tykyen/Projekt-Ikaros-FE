/**
 * 16.1d — Hook pro skin chatu (per uživatel × svět).
 *
 * Default = **efektivní motiv světa** (`:root[data-theme]`, nastaví WorldLayout
 * z preview ?? 5.9b ?? world motiv). Override = členova volba
 * (`WorldMembership.chatSkin` přes `/chat/appearance`), přebije motiv světa
 * jen pro chat tohoto člena v tomto světě.
 *
 * - `skin` — efektivní skin (na `data-chat-skin`).
 * - `applyVars` — true jen při explicitním overridu ≠ motiv světa → kontejner
 *   chatu dostane inline `--theme-*` zvoleného skinu (jinak dědí `:root`,
 *   takže se zachovají 5.9b overrides + přesný vzhled světa).
 */
import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { loadThemeFonts } from '@/themes/applyTheme';
import { DEFAULT_WORLD_THEME } from '@/themes/registry';
import {
  useMembershipAppearance,
  useUpdateAppearance,
  type MembershipAppearance,
} from '../api/useMembershipAppearance';
import { isChatSkin, type ChatSkinId } from './registry';

function readRootTheme(): string {
  if (typeof document === 'undefined') return DEFAULT_WORLD_THEME;
  return (
    document.documentElement.getAttribute('data-theme') || DEFAULT_WORLD_THEME
  );
}

/** Reaktivně sleduje efektivní motiv světa (`:root[data-theme]`). */
function useRootThemeId(): string {
  const [id, setId] = useState(readRootTheme);
  useEffect(() => {
    const obs = new MutationObserver(() => setId(readRootTheme()));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- jednorázový sync na aktuální DOM data-theme při mountu (řeší race render↔effect)
    setId(readRootTheme());
    return () => obs.disconnect();
  }, []);
  return id;
}

export interface UseChatSkinResult {
  /** Efektivní skin (pro `data-chat-skin`). */
  skin: string;
  /** True, pokud člen má vlastní (explicitní) volbu skinu. */
  isExplicit: boolean;
  /** True → přepsat `--theme-*` na kontejneru chatu (override ≠ motiv světa). */
  applyVars: boolean;
  /** Změní skin (self). `null` = auto (dědí motiv světa). Optimistic + persist. */
  setSkin: (next: ChatSkinId | null) => void;
  isPending: boolean;
}

export function useChatSkin(worldId: string): UseChatSkinResult {
  const appearance = useMembershipAppearance(worldId);
  const update = useUpdateAppearance(worldId);
  const qc = useQueryClient();
  const worldMotiv = useRootThemeId();

  const stored = appearance.data?.chatSkin;
  const isExplicit = isChatSkin(stored);
  const skin = isExplicit ? stored : worldMotiv;
  const applyVars = isExplicit && skin !== worldMotiv;

  // Override skin může mít font, který motiv světa nenačetl → dolož ho.
  useEffect(() => {
    if (applyVars) void loadThemeFonts(skin);
  }, [applyVars, skin]);

  const setSkin = useCallback(
    (next: ChatSkinId | null) => {
      const key = ['world-chat', worldId, 'appearance'] as const;
      const prev = qc.getQueryData<MembershipAppearance>(key);
      // Optimistic — přepiš chatSkin v cache hned (instant reskin).
      if (prev) qc.setQueryData<MembershipAppearance>(key, { ...prev, chatSkin: next });
      update.mutate(
        { chatSkin: next },
        {
          onError: () => {
            if (prev) qc.setQueryData(key, prev);
          },
        },
      );
    },
    [qc, update, worldId],
  );

  return { skin, isExplicit, applyVars, setSkin, isPending: update.isPending };
}
