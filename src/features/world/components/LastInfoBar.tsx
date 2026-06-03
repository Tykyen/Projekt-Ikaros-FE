import { useState } from 'react';
import { Info, X } from 'lucide-react';
import type { LastInfo } from '@/shared/types';
import s from './LastInfoBar.module.css';

interface Props {
  worldId: string;
  lastInfo: LastInfo | null | undefined;
}

const key = (worldId: string) => `ikaros.lastinfo.dismissed.${worldId}`;

/**
 * 12.2 — proužek „Last info" pod hlavičkou světa (oznámení PJ členům).
 * Dismiss je klientský: ukládáme `updatedAt` poslední zavřené zprávy do
 * localStorage, takže nová/upravená zpráva se objeví znovu.
 */
export function LastInfoBar({ worldId, lastInfo }: Props) {
  const [dismissed, setDismissed] = useState<string | null>(() => {
    try {
      return localStorage.getItem(key(worldId));
    } catch {
      return null;
    }
  });

  if (!lastInfo || !lastInfo.visible || !lastInfo.text.trim()) return null;
  if (dismissed === lastInfo.updatedAt) return null;

  function close() {
    try {
      localStorage.setItem(key(worldId), lastInfo!.updatedAt);
    } catch {
      /* localStorage nedostupné — zavřeme jen pro tuto session */
    }
    setDismissed(lastInfo!.updatedAt);
  }

  return (
    <div className={s.bar} role="status">
      <Info size={15} className={s.icon} aria-hidden />
      <span className={s.text}>{lastInfo.text}</span>
      <button
        type="button"
        className={s.close}
        onClick={close}
        aria-label="Zavřít oznámení"
        title="Zavřít"
      >
        <X size={15} />
      </button>
    </div>
  );
}
