import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useMemo } from 'react';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { usePagesDirectory } from '../../api/usePagesDirectory';
import type { AccessRequirement } from '../../api/pages.types';
import s from './AkjBanner.module.css';

interface Props {
  /** Všechny `accessRequirements` stránky — vyfiltrujeme AKJ/AKJType. */
  accessRequirements: AccessRequirement[];
}

/**
 * 7.1c — Banner „Utajený archiv". Zobrazuje se nad obsahem stránky, pokud
 * `accessRequirements` obsahuje typ `AKJ` nebo `AKJType`. User se dostal
 * až sem = přístup OK, banner je „úspěšně dešifrováno".
 *
 * 7.1c (rozhodnuto 2026-05-21) — klikatelný:
 *  • `AKJType` → naviguje na meta stránku `akj-<key>` (pokud existuje v directory)
 *  • `AKJ` (číslo) → ne-klikatelný, žádná meta stránka neexistuje
 *  • Meta stránka neexistuje → klik no-op + tooltip
 *
 * Stylizace dle světa: pozadí `var(--accent-soft, var(--bg-overlay))`,
 * border `var(--accent)`, monospace font. Theme tokens převzaty ze stávající
 * sady (viz [src/themes/applyTheme.ts]).
 */
export function AkjBanner({ accessRequirements }: Props) {
  const { worldSlug, worldId } = useWorldContext();
  const { data: directory = [] } = usePagesDirectory(worldId);

  const akjReqs = useMemo(
    () => accessRequirements.filter((r) => r.type === 'AKJ' || r.type === 'AKJType'),
    [accessRequirements],
  );

  const primary = akjReqs[0];
  if (!primary) return null;

  const metaSlug = primary.type === 'AKJType' ? `akj-${primary.value}` : null;
  const metaExists =
    metaSlug !== null && directory.some((d) => d.slug === metaSlug);
  const clickable = metaSlug !== null && metaExists;

  const label =
    primary.type === 'AKJType'
      ? `AKJ ${primary.value}`
      : `AKJ ≥ ${primary.value}`;
  const additional = akjReqs.length - 1;

  const inner = (
    <>
      <Lock size={16} aria-hidden className={s.icon} />
      <span className={s.label}>
        Utajený archiv • {label}
        {additional > 0 && ` +${additional} dalších`}
      </span>
      <span className={s.status}>Úspěšně dešifrováno</span>
    </>
  );

  if (clickable && metaSlug) {
    return (
      <Link
        to={`/svet/${worldSlug}/${metaSlug}`}
        className={`${s.banner} ${s.clickable}`}
        title={`Otevřít meta stránku „${label}"`}
      >
        {inner}
      </Link>
    );
  }

  const tooltip =
    primary.type === 'AKJType'
      ? 'Meta stránka tohoto AKJ ještě neexistuje — PJ ji vytvoří v editoru.'
      : 'Číselný AKJ requirement nemá samostatnou meta stránku.';

  return (
    <div className={s.banner} role="status" title={tooltip}>
      {inner}
    </div>
  );
}
