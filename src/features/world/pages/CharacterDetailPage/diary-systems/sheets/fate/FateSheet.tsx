/**
 * 8.7i — Fate sheet (wrapper nad sdíleným FateLikeSheet s prefixem `fate_`).
 */
import type { SystemSheetProps } from '../../types';
import { FateLikeSheet } from '../../_shared/FateLikeSheet';

export function FateSheet(props: SystemSheetProps) {
  return <FateLikeSheet {...props} prefix="fate_" />;
}
