import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/shared/ui/Modal/Modal';
import { Button } from '@/shared/ui/Button/Button';
import { ConfirmDialog } from '@/shared/ui';
import { formatCurrency } from '@/features/world/currencies/shared/convertAmount';
import type { WorldCurrencyItem } from '@/features/world/currencies/types';
import { usePurchases, useRefund } from '../api';
import type { Purchase } from '../types';
import s from './shop.module.css';

interface MyPurchasesPanelProps {
  worldId: string;
  characterId: string;
  characterName: string;
  currencyItems: WorldCurrencyItem[];
  onClose: () => void;
}

/** Spec 11.3 §6.2 — historie nákupů postavy + storno (jen na stránce Obchod). */
export function MyPurchasesPanel({
  worldId,
  characterId,
  characterName,
  currencyItems,
  onClose,
}: MyPurchasesPanelProps) {
  const { data: purchases = [], isLoading } = usePurchases(
    worldId,
    characterId,
  );
  const refundM = useRefund(worldId);
  const [toRefund, setToRefund] = useState<Purchase | null>(null);

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
              ) : (
                <button
                  type="button"
                  className={s.iconBtn}
                  title="Vrátit nákup"
                  onClick={() => setToRefund(p)}
                >
                  ↩ Vrátit
                </button>
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
