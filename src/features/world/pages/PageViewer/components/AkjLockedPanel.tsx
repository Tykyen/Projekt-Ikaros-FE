import { Lock } from 'lucide-react';
import type { AccessRequirement } from '../../api/pages.types';
import { useAkjArchiveTitle } from './useAkjArchiveTitle';
import s from './AkjLockedPanel.module.css';

interface Props {
  worldId: string;
  /** Stripnuté requirements z BE (jen AKJ/AKJType) — pro „úroveň N". */
  accessRequirements?: AccessRequirement[];
  isWoodWide?: boolean;
}

/**
 * spec-akj-locked-tabs-visible — obsah AKJ záložky, na kterou viewer NEMÁ
 * přístup. BE poslal jen jméno + úroveň (bez obsahu, `locked:true`), takže
 * místo `OstatniLayout` ukážeme tento „zašifrovaný" panel.
 *
 * Zrcadlí [AkjDecryptedBanner] (odemčený stav „Úspěšně dešifrováno") —
 * stejný titulek přes [useAkjArchiveTitle], jen podtitul „Zašifrováno"
 * a zámek místo úspěchu. Theme variants přes `[data-theme]` na rootu.
 */
export function AkjLockedPanel({
  worldId,
  accessRequirements,
  isWoodWide,
}: Props) {
  const title =
    useAkjArchiveTitle(worldId, accessRequirements, isWoodWide) ??
    'UTAJENÝ ARCHIV';

  return (
    <div className={s.wrap} role="note" aria-label="Zašifrovaná záložka">
      <div className={s.icon} aria-hidden>
        <Lock size={40} />
      </div>
      <strong className={s.title}>{title}</strong>
      <span className={s.subtitle}>Zašifrováno</span>
      <p className={s.hint}>
        Tato záložka je utajená. Pro odemčení potřebuješ vyšší přístup (AKJ) —
        promluv s PJ světa.
      </p>
    </div>
  );
}
