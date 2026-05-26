import { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { Modal, Button } from '@/shared/ui';
import {
  formatCurrency,
  type WorldCurrencyItem,
} from '@/features/world/currencies/shared';
import type {
  CharacterAccount,
  FantasyDateLike,
} from '../../../api/characters.types';
import { useAccountAddMonthly } from '../../../api/useCharacterAccounts';
import { InGameDateField } from './InGameDateField';
import { useDefaultInGameDate } from './useDefaultInGameDate';
import s from './ConfirmAddMonthlyModal.module.css';

interface ConfirmAddMonthlyModalProps {
  worldId: string;
  account: CharacterAccount;
  currencies: WorldCurrencyItem[];
  onClose: () => void;
}

/**
 * Spec 8.x-prep §4.2 (B2) + §4.4 (B4) — modal pro „Zaúčtovat měsíc".
 *
 * - Preview delta = income.sum − expense.sum (přes formatCurrency)
 * - InGameDateField (default = currentInGameDate)
 * - Varovná hláška + ⚠ ikona pokud delta === 0 (UX past — user často zaškrtne
 *   label místo částky, viz incident 2026-05-26)
 * - Toast po confirm: konkrétní delta + label (přírůstek/úbytek/beze změny)
 */
export function ConfirmAddMonthlyModal({
  worldId,
  account,
  currencies,
  onClose,
}: ConfirmAddMonthlyModalProps) {
  const defaultDate = useDefaultInGameDate(worldId);
  const [inGameDate, setInGameDate] = useState<FantasyDateLike>(defaultDate);
  const addMonthly = useAccountAddMonthly(worldId, account.id);

  const incomeSum = account.incomeEntries.reduce(
    (sum, e) => sum + e.amount,
    0,
  );
  const expenseSum = account.expenseEntries.reduce(
    (sum, e) => sum + e.amount,
    0,
  );
  const delta = incomeSum - expenseSum;
  const isZero = delta === 0;

  function handleConfirm() {
    addMonthly.mutate(
      { inGameDate },
      {
        onSuccess: () => {
          const label =
            delta > 0 ? 'přírůstek' : delta < 0 ? 'úbytek' : 'beze změny';
          const formatted = formatCurrency(
            Math.abs(delta),
            account.currency,
            currencies,
          );
          const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
          if (isZero) {
            toast.warning(`Zaúčtováno: ${formatted} (${label})`);
          } else {
            toast.success(`Zaúčtováno: ${sign}${formatted} (${label})`);
          }
          onClose();
        },
        onError: () => toast.error('Zaúčtování selhalo'),
      },
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Zaúčtovat měsíc"
      size="md"
      closeOnBackdrop={!addMonthly.isPending}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={addMonthly.isPending}
          >
            Zrušit
          </Button>
          <Button onClick={handleConfirm} loading={addMonthly.isPending}>
            Zaúčtovat
          </Button>
        </>
      }
    >
      <div className={s.body}>
        <div className={s.preview}>
          <h3 className={s.previewTitle}>Přehled změn</h3>
          <div className={s.previewRow}>
            <span>Příjmy:</span>
            <strong className={s.amountPos}>
              +{formatCurrency(incomeSum, account.currency, currencies)}
            </strong>
          </div>
          <div className={s.previewRow}>
            <span>Výdaje:</span>
            <strong className={s.amountNeg}>
              −{formatCurrency(expenseSum, account.currency, currencies)}
            </strong>
          </div>
          <div className={`${s.previewRow} ${s.previewTotal}`}>
            <span>Celková změna:</span>
            <strong
              className={
                delta > 0
                  ? s.amountPos
                  : delta < 0
                    ? s.amountNeg
                    : s.amountZero
              }
            >
              {delta > 0 ? '+' : delta < 0 ? '−' : ''}
              {formatCurrency(
                Math.abs(delta),
                account.currency,
                currencies,
              )}
            </strong>
          </div>
        </div>

        {isZero && (
          <div className={s.warning}>
            <AlertTriangle size={16} aria-hidden />
            <span>
              Příjmy i výdaje jsou nulové — zaúčtuje se transakce s nulovou
              změnou. Zkontroluj, jestli jsi do polí „Částka" vyplnil čísla
              (ne text).
            </span>
          </div>
        )}

        <InGameDateField
          value={inGameDate}
          onChange={setInGameDate}
          worldId={worldId}
          label="Herní datum zaúčtování"
        />
      </div>
    </Modal>
  );
}
