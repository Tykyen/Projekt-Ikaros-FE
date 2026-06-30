/**
 * Fate Accelerated (FAE) — list postavy. Tenký wrapper nad sdíleným
 * `FateLikeSheet` s variantou `fae` (6 fixních Přístupů) a prefixem `fae_`.
 */
import type { SystemSheetProps } from '../../types';
import { FateLikeSheet } from '../../_shared/FateLikeSheet';

export function FaeSheet(props: SystemSheetProps) {
  return <FateLikeSheet {...props} variant="fae" prefix="fae_" />;
}
