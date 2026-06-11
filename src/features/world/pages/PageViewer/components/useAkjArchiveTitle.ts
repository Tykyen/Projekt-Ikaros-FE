import { useMemo } from 'react';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import type { AccessRequirement } from '../../api/pages.types';

const ROLE_LABELS: Record<number, string> = {
  0: 'Žadatel',
  1: 'Čtenář',
  2: 'Hráč',
  3: 'Korektor',
  4: 'Pomocný PJ',
  5: 'Pán jeskyně',
};

/**
 * Sestaví titulek „UTAJENÝ ARCHIV [AKJ: N — Label]" z `accessRequirements`.
 * Sdílené mezi [AkjDecryptedBanner] (odemčeno) a [AkjLockedPanel] (zamčeno) —
 * jeden zdroj pravdy pro znění úrovně. Vrací `null`, když requirements nic
 * nedefinují.
 *
 * Pravidla pro title:
 * - Nejvyšší AKJ/AKJType úroveň → `[AKJ: N — Name]` nebo `[AKJ: N]`
 * - Jinak fallback Role → `[pro <role>]`
 * - Jinak UserId whitelist → `[vyhrazený přístup]`
 */
export function useAkjArchiveTitle(
  worldId: string,
  accessRequirements?: AccessRequirement[],
  isWoodWide?: boolean,
): string | null {
  const { data: settings } = useWorldSettings(worldId);

  return useMemo(() => {
    if (!accessRequirements || accessRequirements.length === 0) return null;

    // Nejvyšší AKJ úroveň (přímá nebo přes AKJType)
    let topLevel = -1;
    let topLabel: string | null = null;
    for (const req of accessRequirements) {
      if (req.type === 'AKJ') {
        const lvl = parseInt(req.value, 10);
        if (lvl > topLevel) {
          topLevel = lvl;
          topLabel = null;
        }
      } else if (req.type === 'AKJType') {
        const def = settings?.akjTypes?.find((a) => a.key === req.value);
        const lvl = def?.level ?? 0;
        if (lvl > topLevel) {
          topLevel = lvl;
          topLabel = def?.name ?? req.value;
        }
      }
    }
    if (topLevel >= 0) {
      const base = topLabel
        ? `AKJ: ${topLevel} — ${topLabel}`
        : `AKJ: ${topLevel}`;
      return `UTAJENÝ ARCHIV [${base}${isWoodWide ? ' · Wood-Wide' : ''}]`;
    }

    // Fallback: jen Role requirement
    const roleReq = accessRequirements.find((r) => r.type === 'Role');
    if (roleReq) {
      const lvl = parseInt(roleReq.value, 10);
      const label = ROLE_LABELS[lvl] ?? `úroveň ${lvl}`;
      return `UTAJENÝ ARCHIV [pro ${label}${isWoodWide ? ' · Wood-Wide' : ''}]`;
    }

    // Fallback: jen UserId whitelist
    if (accessRequirements.some((r) => r.type === 'UserId')) {
      return `UTAJENÝ ARCHIV [vyhrazený přístup${
        isWoodWide ? ' · Wood-Wide' : ''
      }]`;
    }

    return null;
  }, [accessRequirements, settings?.akjTypes, isWoodWide]);
}
