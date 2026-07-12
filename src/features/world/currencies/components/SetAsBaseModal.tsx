import { useMemo } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/shared/ui/Modal/Modal';
import { Button } from '@/shared/ui/Button/Button';
import { isCurrencyConflict, useUpdateCurrencies } from '../api';
import type { WorldCurrencyItem } from '../types';
import {
  moveBaseToFront,
  recomputeRatesForNewBase,
} from '../utils/setAsBase';
import s from './SetAsBaseModal.module.css';

interface SetAsBaseModalProps {
  worldId: string;
  items: WorldCurrencyItem[];
  target: WorldCurrencyItem;
  onClose: () => void;
}

/**
 * Spec 11.4 §4.6 — preview nových kurzů + confirm.
 *
 * Math je v `utils/setAsBase.ts` (poměry zachovány, base = první v poli po
 * `moveBaseToFront`). Save = PUT replace s nově spočítaným items array.
 */
export function SetAsBaseModal({
  worldId,
  items,
  target,
  onClose,
}: SetAsBaseModalProps) {
  const updateMutation = useUpdateCurrencies(worldId);
  const oldBase = items[0];

  const preview = useMemo(() => {
    const recomputed = recomputeRatesForNewBase(items, target.code);
    return moveBaseToFront(recomputed, target.code);
  }, [items, target.code]);

  function handleConfirm() {
    updateMutation.mutate(
      { items: preview },
      {
        onSuccess: () => {
          toast.success(`Základ změněn na „${target.name}".`);
          onClose();
        },
        onError: (err) => {
          // 409 CURRENCY_CONFLICT — hlášku + refetch řeší hook; preview kurzů
          // je po refetchi stale → zavřít.
          if (isCurrencyConflict(err)) {
            onClose();
            return;
          }
          toast.error('Změna základu selhala.');
        },
      },
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Nastavit „${target.name}" jako základ?`}
      size="md"
      closeOnBackdrop={!updateMutation.isPending}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={updateMutation.isPending}>
            Zrušit
          </Button>
          <Button
            onClick={handleConfirm}
            loading={updateMutation.isPending}
          >
            Nastavit jako základ
          </Button>
        </>
      }
    >
      <div className={s.body}>
        <p>
          Změníš základní měnu z <strong>{oldBase?.name}</strong> ({oldBase?.code})
          na <strong>{target.name}</strong> ({target.code}). Poměry mezi
          měnami zůstanou stejné, jen se přepočítají kurzy.
        </p>
        <h4 className={s.previewHeading}>Nové kurzy</h4>
        <table className={s.preview}>
          <thead>
            <tr>
              <th>Měna</th>
              <th className={s.thRate}>Starý kurz</th>
              <th className={s.thRate}>Nový kurz</th>
            </tr>
          </thead>
          <tbody>
            {preview.map((p) => {
              const old = items.find((i) => i.code === p.code);
              const isNewBase = p.code === target.code;
              return (
                <tr key={p.code} data-base={isNewBase || undefined}>
                  <td>
                    <strong>{p.code}</strong> {p.name}
                    {isNewBase && (
                      <span className={s.badge}>nový základ</span>
                    )}
                  </td>
                  <td className={s.tdRate}>{formatRate(old?.rate ?? 0)}</td>
                  <td className={s.tdRate}>{formatRate(p.rate)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

function formatRate(rate: number): string {
  return new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 6 }).format(
    rate,
  );
}
