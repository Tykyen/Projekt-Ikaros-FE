import { AlertTriangle } from 'lucide-react';
import type { AccessRequirement } from '../../api/pages.types';
import { useAkjArchiveTitle } from './useAkjArchiveTitle';
import s from './AkjDecryptedBanner.module.css';

interface Props {
  worldId: string;
  accessRequirements?: AccessRequirement[];
  isWoodWide?: boolean;
}

/**
 * D-062b — banner zobrazený nad obsahem AKJ-chráněné stránky, pokud user
 * **má** přístup. Indikuje, že content je citlivý („utajený archiv") + že
 * uživatel ho úspěšně dešifroval. Vychází z legacy Matrix vzoru.
 *
 * Titulek („UTAJENÝ ARCHIV [AKJ: N]") sdílí přes [useAkjArchiveTitle] se
 * zamčenou variantou [AkjLockedPanel] — jeden zdroj pravdy.
 *
 * Theme variants (📜 / ☠ / 🗝 / ⚠) jsou CSS přes `[data-theme]` na rootu.
 */
export function AkjDecryptedBanner({
  worldId,
  accessRequirements,
  isWoodWide,
}: Props) {
  const title = useAkjArchiveTitle(worldId, accessRequirements, isWoodWide);

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
