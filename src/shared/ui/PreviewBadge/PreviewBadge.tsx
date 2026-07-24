import { FlaskConical } from 'lucide-react';
import clsx from 'clsx';
import { Badge } from '../Badge/Badge';
import s from './PreviewBadge.module.css';

/**
 * R3 27.3 — „Preview" štítek pro plochy třídy B (scope registr). Signalizuje
 * „funkce v betě — může se měnit, nižší priorita supportu" bez odebrání funkce.
 *
 * Default = kompaktní ikona ⚗ (šetří místo v husté nav; význam nese tooltip).
 * `showLabel` = plný textový štítek „Preview" (hlavičky stránek, kde je místo).
 *
 * Reuse `Badge` (variant warning) = konzistentní tokeny a vzhled.
 */
const TITLE = 'Preview — funkce v betě, může se měnit (nižší priorita supportu)';

export function PreviewBadge({
  showLabel = false,
  className,
}: {
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <Badge
      variant="warning"
      className={clsx(s.previewBadge, !showLabel && s.iconOnly, className)}
      title={TITLE}
      aria-label={TITLE}
      icon={<FlaskConical size={12} aria-hidden />}
    >
      {showLabel ? 'Preview' : null}
    </Badge>
  );
}
