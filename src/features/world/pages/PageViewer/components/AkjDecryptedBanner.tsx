import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import type { AccessRequirement } from '../../api/pages.types';
import s from './AkjDecryptedBanner.module.css';

interface Props {
  worldId: string;
  accessRequirements?: AccessRequirement[];
  isWoodWide?: boolean;
}

const ROLE_LABELS: Record<number, string> = {
  0: 'Žadatel',
  1: 'Čtenář',
  2: 'Hráč',
  3: 'Korektor',
  4: 'Pomocný PJ',
  5: 'Pán jeskyně',
};

/**
 * D-062b — banner zobrazený nad obsahem AKJ-chráněné stránky, pokud user
 * **má** přístup. Indikuje, že content je citlivý („utajený archiv") + že
 * uživatel ho úspěšně dešifroval. Vychází z legacy Matrix vzoru.
 *
 * Pravidla pro title:
 * - Najdeme nejvyšší AKJ/AKJType úroveň → `[AKJ: N — Name]` nebo `[AKJ: N]`
 * - Pokud nic AKJ, fallback na Role → `[pro <role>]`
 * - Pokud ani Role, na UserId whitelist → `[vyhrazený přístup]`
 *
 * Theme variants (📜 / ☠ / 🗝 / ⚠) jsou CSS přes `[data-theme]` na rootu.
 */
export function AkjDecryptedBanner({
  worldId,
  accessRequirements,
  isWoodWide,
}: Props) {
  const { data: settings } = useWorldSettings(worldId);

  const title = useMemo(() => {
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
      return `UTAJENÝ ARCHIV [pro ${label}${
        isWoodWide ? ' · Wood-Wide' : ''
      }]`;
    }

    // Fallback: jen UserId whitelist
    if (accessRequirements.some((r) => r.type === 'UserId')) {
      return `UTAJENÝ ARCHIV [vyhrazený přístup${
        isWoodWide ? ' · Wood-Wide' : ''
      }]`;
    }

    return null;
  }, [accessRequirements, settings?.akjTypes, isWoodWide]);

  if (!title) return null;

  return (
    <div className={s.banner} role="note" aria-label="Utajený archiv">
      <div className={s.icon} aria-hidden>
        <AlertTriangle size={20} />
      </div>
      <div className={s.body}>
        <strong className={s.title}>{title}</strong>
        <span className={s.subtitle}>Úspěšně dešifrováno</span>
      </div>
    </div>
  );
}
