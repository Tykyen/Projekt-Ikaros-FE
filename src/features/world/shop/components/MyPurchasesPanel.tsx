import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/shared/ui/Modal/Modal';
import { Button } from '@/shared/ui/Button/Button';
import { ConfirmDialog } from '@/shared/ui';
import { formatCurrency } from '@/features/world/currencies/shared/convertAmount';
import type { WorldCurrencyItem } from '@/features/world/currencies/types';
import { useCharacterAccounts } from '@/features/world/pages/api/useCharacterAccounts';
import { usePurchases, useRefund } from '../api';
import type { Purchase } from '../types';
import s from './shop.module.css';

interface MyPurchasesPanelProps {
  worldId: string;
  characterId: string;
  characterSlug: string;
  characterName: string;
  currencyItems: WorldCurrencyItem[];
  /** PJ/PomocnyPJ — obchází `allowPlayerSelfAdjust` (storno smí vždy). */
  isStaff: boolean;
  onClose: () => void;
}

/** Spec 11.3 §6.2 — historie nákupů postavy + storno (jen na stránce Obchod). */
export function MyPurchasesPanel({
  worldId,
  characterId,
  characterSlug,
  characterName,
  currencyItems,
  isStaff,
  onClose,
}: MyPurchasesPanelProps) {
  const { data: purchases = [], isLoading } = usePurchases(
    worldId,
    characterId,
  );
  // N-23 — storno volá BE `adjust` (`assertCanAdjust`): hráč smí jen pokud
  // má účet `allowPlayerSelfAdjust`. Bez tohoto gatingu FE zobrazil „Vrátit"
  // vždy → 403 → němá chyba. Účty mapujeme přes accountId nákupu.
  const { data: accounts = [] } = useCharacterAccounts(worldId, characterSlug);
  const refundM = useRefund(worldId);
  const [toRefund, setToRefund] = useState<Purchase | null>(null);

  const canRefund = (p: Purchase): boolean => {
    if (isStaff) return true;
    const account = accounts.find((a) => a.id === p.accountId);
    return !!account?.allowPlayerSelfAdjust;
  };

  function refund() {
    if (!toRefund) return;
    refundM.mutate(toRefund.id, {
      onSuccess: (res) => {
        toast.success(
          `Vráceno „${toRefund.itemSnapshot.name}". Zůstatek: ${formatCurrency(
            res.newBalance,
            toRefund.paidCurrency,
            currencyItems,
          )}`,
        );
        setToRefund(null);
      },
      onError: () => toast.error('Storno selhalo.'),
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Nákupy: ${characterName}`}
      size="md"
      footer={
        <Button variant="ghost" onClick={onClose}>
          Zavřít
        </Button>
      }
    >
      <div className={s.groupTree}>
        {isLoading ? (
          <p className={s.dim}>Načítám…</p>
        ) : purchases.length === 0 ? (
          <p className={s.empty}>Zatím žádné nákupy.</p>
        ) : (
          purchases.map((p) => (
            <div key={p.id} className={s.groupRow}>
              <span className={s.groupName}>
                {p.itemSnapshot.name}
                {p.quantity > 1 && ` ×${p.quantity}`}
              </span>
              <span className={s.dim}>
                {formatCurrency(p.paidAmount, p.paidCurrency, currencyItems)}
              </span>
              {p.status === 'refunded' ? (
                <span className={s.dim}>vráceno</span>
              ) : canRefund(p) ? (
                <button
                  type="button"
                  className={s.iconBtn}
                  title="Vrátit nákup"
                  onClick={() => setToRefund(p)}
                >
                  ↩ Vrátit
                </button>
              ) : (
                <span className={s.dim} title="Storno smí provést jen PJ">
                  storno u PJ
                </span>
              )}
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!toRefund}
        onClose={() => setToRefund(null)}
        title="Vrátit nákup"
        message={`Vrátit „${toRefund?.itemSnapshot.name}"? Peníze se vrátí na účet a položka zmizí z vybavení.`}
        confirmLabel="Vrátit"
        isPending={refundM.isPending}
        onConfirm={refund}
      />
    </Modal>
  );
}
