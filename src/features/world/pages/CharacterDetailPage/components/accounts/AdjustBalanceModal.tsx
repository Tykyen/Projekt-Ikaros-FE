import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { Modal, Button, Input } from '@/shared/ui';
import {
  formatCurrency,
  getCurrencySymbol,
  type WorldCurrencyItem,
} from '@/features/world/currencies/shared';
import type {
  CharacterAccount,
  FantasyDateLike,
} from '../../../api/characters.types';
import { useAccountAdjust } from '../../../api/useCharacterAccounts';
import { InGameDateField } from './InGameDateField';
import { useDefaultInGameDate } from './useDefaultInGameDate';
import s from './AdjustBalanceModal.module.css';

interface AdjustBalanceModalProps {
  worldId: string;
  account: CharacterAccount;
  currencies: WorldCurrencyItem[];
  onClose: () => void;
}

type Mode = 'deposit' | 'withdraw';

/**
 * Spec 8.x-prep §4.3 (B3) + §4.4 (B4) — manuální vklad / výběr.
 *
 * - Toggle Vklad / Výběr (default Vklad) — mění sign na amount inputu
 * - Amount > 0 (zod-style validace na FE; BE odmítne 0)
 * - Povinný reason (1–200 znaků)
 * - InGameDateField (default = currentInGameDate)
 *
 * Permission gate je na BE (assertCanAdjust): PJ+ vždy, hráč-vlastník jen
 * pokud account.allowPlayerSelfAdjust. UI viditelnost tlačítka řeší caller
 * (FinanceTab header), tato modal se neptá — BE odmítne 403 pokud.
 */
export function AdjustBalanceModal({
  worldId,
  account,
  currencies,
  onClose,
}: AdjustBalanceModalProps) {
  const defaultDate = useDefaultInGameDate(worldId);
  const [mode, setMode] = useState<Mode>('deposit');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [inGameDate, setInGameDate] = useState<FantasyDateLike>(defaultDate);
  const [errors, setErrors] = useState<{ amount?: string; reason?: string }>(
    {},
  );
  const adjust = useAccountAdjust(worldId, account.id);

  const currencySymbol = getCurrencySymbol(account.currency, currencies);

  function validate(): boolean {
    const next: { amount?: string; reason?: string } = {};
    const num = Number(amount);
    if (!amount || !Number.isFinite(num) || num <= 0) {
      next.amount = 'Zadej kladné číslo větší než 0.';
    }
    if (!reason.trim()) {
      next.reason = 'Důvod je povinný.';
    } else if (reason.trim().length > 200) {
      next.reason = 'Max 200 znaků.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleConfirm() {
    if (!validate()) return;
    const num = Number(amount);
    const finalDelta = mode === 'withdraw' ? -num : num;
    adjust.mutate(
      { amount: finalDelta, reason: reason.trim(), inGameDate },
      {
        onSuccess: () => {
          const label = mode === 'deposit' ? 'Vklad' : 'Výběr';
          const sign = mode === 'deposit' ? '+' : '−';
          toast.success(
            `${label}: ${sign}${formatCurrency(num, account.currency, currencies)}`,
          );
          onClose();
        },
        onError: (err) => {
          const e = err as Error & {
            response?: { data?: { code?: string; message?: string } };
          };
          const code = e?.response?.data?.code;
          if (code === 'PLAYER_ADJUST_DISABLED') {
            toast.error('PJ pro tento účet hráčův vklad/výběr nepovolil.');
          } else if (code === 'FORBIDDEN_ADJUST') {
            toast.error('Nemáš oprávnění.');
          } else {
            toast.error(e?.response?.data?.message ?? 'Operace selhala.');
          }
        },
      },
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`${mode === 'deposit' ? 'Vklad' : 'Výběr'} na účet „${account.label}"`}
      size="md"
      closeOnBackdrop={!adjust.isPending}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={adjust.isPending}
          >
            Zrušit
          </Button>
          <Button onClick={handleConfirm} loading={adjust.isPending}>
            Potvrdit
          </Button>
        </>
      }
    >
      <div className={s.body}>
        <div
          className={s.modeToggle}
          role="radiogroup"
          aria-label="Typ operace"
        >
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'deposit'}
            className={`${s.modeBtn} ${mode === 'deposit' ? s.modeBtnActive : ''}`}
            onClick={() => setMode('deposit')}
          >
            <ArrowDownToLine size={16} aria-hidden /> Vklad
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'withdraw'}
            className={`${s.modeBtn} ${mode === 'withdraw' ? s.modeBtnActive : ''}`}
            onClick={() => setMode('withdraw')}
          >
            <ArrowUpFromLine size={16} aria-hidden /> Výběr
          </button>
        </div>

        <label className={s.field}>
          <span className={s.fieldLabel}>Částka ({currencySymbol})</span>
          <Input
            type="number"
            min={0.01}
            step={0.01}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            error={errors.amount}
            data-testid="adjust-amount"
          />
        </label>

        <label className={s.field}>
          <span className={s.fieldLabel}>Důvod (povinný)</span>
          <textarea
            className={s.textarea}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="např. Nálezeš poklad, Odměna od barona, Pokuta…"
            maxLength={200}
            rows={2}
            data-testid="adjust-reason"
          />
          {errors.reason && (
            <span className={s.errorMsg}>{errors.reason}</span>
          )}
          <span className={s.counter}>{reason.length} / 200</span>
        </label>

        <InGameDateField
          value={inGameDate}
          onChange={setInGameDate}
          worldId={worldId}
          label="Herní datum"
        />
      </div>
    </Modal>
  );
}
