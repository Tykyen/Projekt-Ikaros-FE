/**
 * Spec 11.4 §4.7b — sdílená currency infrastruktura.
 *
 * Konzumenti (Shop 11.3c, Character finance 8.x, inventory, …) importují
 * VŽDY z tohoto barrelu, ne z interních souborů:
 *
 *     import { CurrencyDisplay, useUserPreferredCurrency }
 *       from '@/features/world/currencies/shared';
 */

export {
  convertAmount,
  formatAmount,
  formatCurrency,
  getCurrencySymbol,
} from './convertAmount';

export {
  useUserPreferredCurrency,
  type UseUserPreferredCurrencyResult,
} from './useUserPreferredCurrency';

export { CurrencySelect } from './CurrencySelect';
export { CurrencyDisplay } from './CurrencyDisplay';
export { CurrencyAmountInput } from './CurrencyAmountInput';
export { UnknownCurrencyChip } from './UnknownCurrencyChip';

export type { WorldCurrencyItem } from '../types';
