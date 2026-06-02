import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/shared/ui/Modal/Modal';
import { Button } from '@/shared/ui/Button/Button';
import { useCharacterAccounts } from '@/features/world/pages/api/useCharacterAccounts';
import {
  convertAmount,
  formatCurrency,
} from '@/features/world/currencies/shared/convertAmount';
import type { WorldCurrencyItem } from '@/features/world/currencies/types';
import { usePurchase } from '../api';
import type { ShopItem, ShopGroup } from '../types';
import { effectiveDiscount, effectivePrice } from '../pricing';
import s from './shop.module.css';

interface TargetCharacter {
  id: string;
  slug: string;
  name: string;
}

interface PurchaseDialogProps {
  worldId: string;
  item: ShopItem;
  group?: ShopGroup | null;
  subgroup?: ShopGroup | null;
  character: TargetCharacter;
  currencyItems: WorldCurrencyItem[];
  /** PJ/PomocnyPJ — obchází `allowPlayerSelfAdjust`. */
  isStaff: boolean;
  onClose: () => void;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/** Spec 11.3 §6.1 — nákupní dialog se zůstatkem před → po. */
export function PurchaseDialog({
  worldId,
  item,
  group,
  subgroup,
  character,
  currencyItems,
  isStaff,
  onClose,
}: PurchaseDialogProps) {
  const { data: accounts = [], isLoading } = useCharacterAccounts(
    worldId,
    character.slug,
  );
  const purchaseM = usePurchase(worldId);

  const [accountId, setAccountId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const account = useMemo(
    () => accounts.find((a) => a.id === accountId) ?? accounts[0],
    [accounts, accountId],
  );

  const disc = effectiveDiscount(item, group, subgroup);
  const effUnit = effectivePrice(item, group, subgroup);
  const itemCurrency = item.currencyCode || account?.currency || '';
  const totalItemCur = round4(effUnit * quantity);

  // Cena převedená do měny účtu (null = měna chybí → nelze spočítat).
  const paidAmount = useMemo(() => {
    if (!account) return null;
    if (!itemCurrency || itemCurrency === account.currency)
      return round4(totalItemCur);
    const conv = convertAmount(
      totalItemCur,
      itemCurrency,
      account.currency,
      currencyItems,
    );
    return conv === null ? null : round4(conv);
  }, [account, itemCurrency, totalItemCur, currencyItems]);

  const balanceAfter =
    account && paidAmount !== null ? round4(account.balance - paidAmount) : null;
  const insufficient = balanceAfter !== null && balanceAfter < 0;
  const blockedNoSelfAdjust =
    !isStaff && !!account && !account.allowPlayerSelfAdjust;
  const canBuy =
    !!account &&
    paidAmount !== null &&
    quantity >= 1 &&
    !insufficient &&
    !blockedNoSelfAdjust &&
    !purchaseM.isPending;

  function buy() {
    if (!account || !canBuy) return;
    purchaseM.mutate(
      {
        itemId: item.id,
        characterId: character.id,
        accountId: account.id,
        quantity,
      },
      {
        onSuccess: (res) => {
          toast.success(
            `Koupeno „${item.name}" — přidáno do vybavení. Zůstatek: ${formatCurrency(
              res.newBalance,
              account.currency,
              currencyItems,
            )}`,
          );
          onClose();
        },
        onError: (err) => {
          const data = (
            err as Error & {
              response?: { data?: { message?: string; code?: string } };
            }
          )?.response?.data;
          toast.error(
            data?.code === 'INSUFFICIENT_FUNDS'
              ? 'Na účtu není dostatek prostředků.'
              : (data?.message ?? 'Nákup selhal.'),
          );
        },
      },
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Koupit: ${item.name}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Zrušit
          </Button>
          <Button onClick={buy} disabled={!canBuy} loading={purchaseM.isPending}>
            Koupit
          </Button>
        </>
      }
    >
      <div className={s.form}>
        <div className={s.cardPrice}>
          {disc > 0 && (
            <span className={s.origPrice}>
              {formatCurrency(item.price, itemCurrency, currencyItems)}
            </span>
          )}
          <span className={s.effPrice}>
            {formatCurrency(effUnit, itemCurrency, currencyItems)}
          </span>
          {disc > 0 && <span className={s.discBadge}>−{disc} %</span>}
        </div>

        <div className={s.fieldLabel}>Pro: {character.name}</div>

        {isLoading ? (
          <p className={s.dim}>Načítám účty…</p>
        ) : accounts.length === 0 ? (
          <p className={s.dim}>Postava nemá žádný účet.</p>
        ) : (
          <label className={s.fieldLabel}>
            Platit z účtu
            <select
              className={s.select}
              value={account?.id ?? ''}
              onChange={(e) => setAccountId(e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} — {formatCurrency(a.balance, a.currency, currencyItems)}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className={s.fieldLabel}>
          Množství
          <span className={s.qtyRow}>
            <button
              type="button"
              className={s.iconBtn}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Méně"
            >
              −
            </button>
            <input
              className={s.qtyInput}
              type="number"
              min={1}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, Math.floor(Number(e.target.value) || 1)))
              }
            />
            <button
              type="button"
              className={s.iconBtn}
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Více"
            >
              +
            </button>
          </span>
        </label>

        {account && paidAmount !== null && (
          <>
            <div className={s.summaryRow}>
              <span>Celkem</span>
              <strong>
                {formatCurrency(paidAmount, account.currency, currencyItems)}
              </strong>
            </div>
            <div className={s.summaryRow}>
              <span>Zůstatek</span>
              <span>
                {formatCurrency(account.balance, account.currency, currencyItems)}
                {' → '}
                <strong className={insufficient ? s.negative : undefined}>
                  {formatCurrency(
                    balanceAfter ?? 0,
                    account.currency,
                    currencyItems,
                  )}
                </strong>
              </span>
            </div>
          </>
        )}

        {account && paidAmount === null && (
          <p className={s.negative}>
            Cenu nelze převést do měny účtu (chybějící kurz).
          </p>
        )}

        {blockedNoSelfAdjust && (
          <p className={s.dim}>
            PJ ti pro tento účet nepovolil samostatný nákup — požádej PJ.
          </p>
        )}
      </div>
    </Modal>
  );
}
