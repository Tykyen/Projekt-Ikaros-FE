/**
 * Fate Core — list postavy. Tenký wrapper nad sdíleným `FateLikeSheet`
 * s variantou `core` (volné Dovednosti + žebříček) a prefixem `fate_`.
 */
import type { SystemSheetProps } from '../../types';
import { FateLikeSheet } from '../../_shared/FateLikeSheet';

export function FateSheet(props: SystemSheetProps) {
  return <FateLikeSheet {...props} variant="core" prefix="fate_" />;
}
