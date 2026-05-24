/**
 * 8.7j — PI (Příběhy Impéria) sheet (wrapper s prefixem `pi_`).
 * Reuse sdíleného FateLikeSheet — liší se jen prefix a vizuální téma
 * (brass serif vs Fate modré sans-serif).
 */
import type { SystemSheetProps } from '../../types';
import { FateLikeSheet } from '../../_shared/FateLikeSheet';

export function PiSheet(props: SystemSheetProps) {
  return <FateLikeSheet {...props} prefix="pi_" />;
}
