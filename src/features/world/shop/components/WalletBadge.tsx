import { useCharacterAccounts } from '@/features/world/pages/api/useCharacterAccounts';
import { formatCurrency } from '@/features/world/currencies/shared/convertAmount';
import type { WorldCurrencyItem } from '@/features/world/currencies/types';
import s from './shop.module.css';

interface WalletBadgeProps {
  worldId: string;
  characterSlug: string;
  characterName: string;
  currencyItems: WorldCurrencyItem[];
}

/** Spec 11.3 §4.1 — peněženka cílové postavy v headeru (zůstatek před nákupem). */
export function WalletBadge({
  worldId,
  characterSlug,
  characterName,
  currencyItems,
}: WalletBadgeProps) {
  const { data: accounts = [], isLoading } = useCharacterAccounts(
    worldId,
    characterSlug,
  );

  return (
    <span className={s.wallet} title={`Peněženka: ${characterName}`}>
      <span className={s.walletIcon}>👛</span>
      <span className={s.walletName}>{characterName}</span>
      {isLoading ? (
        <span className={s.walletAmount}>…</span>
      ) : accounts.length === 0 ? (
        <span className={s.walletAmount}>—</span>
      ) : (
        accounts.map((acc) => (
          <span key={acc.id} className={s.walletAmount}>
            {formatCurrency(acc.balance, acc.currency, currencyItems)}
          </span>
        ))
      )}
    </span>
  );
}
