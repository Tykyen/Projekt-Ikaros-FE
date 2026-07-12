import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Modal } from '@/shared/ui';
import { api } from '@/shared/api/client';
import { useCharacterDirectory } from '../../../api/useCharacterDirectory';
import { useAccountTransfer } from '../../../api/useCharacterAccounts';
import { charactersQueryKey } from '../../../api/characters.types';
import type {
  CharacterAccount,
  FantasyDateLike,
} from '../../../api/characters.types';
import { InGameDateField } from './InGameDateField';
import { useDefaultInGameDate } from './useDefaultInGameDate';
import s from './accounts.module.css';

interface Props {
  worldId: string;
  fromAccount: CharacterAccount;
  onClose: () => void;
  onTransferred: () => void;
}

/**
 * 8.6 — Transfer modal. Workflow:
 *   1. Vyber postavu (picker — directory, exclude vlastní postavu pokud má jen 1 účet)
 *   2. Vyber účet té postavy (fetch list, filtr na stejnou měnu)
 *   3. Zadej částku + popis
 *   4. Validace currency match → Poslat
 *
 * Q8.3 — instant doručení, žádný akcept-flow. Soft notifikace = dluh.
 */
export function TransferModal({
  worldId,
  fromAccount,
  onClose,
  onTransferred,
}: Props) {
  const transfer = useAccountTransfer(worldId, fromAccount.id);
  const directory = useCharacterDirectory(worldId);

  const [targetSlug, setTargetSlug] = useState<string>('');
  const [targetAccountIdState, setTargetAccountIdState] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  // D-PURCHASE-IDEMPOTENCY — nonce per převodní ZÁMĚR: vzniká při otevření
  // modalu (mount), po úspěchu se resetuje. Dvojklik/retry TÉHOŽ záměru
  // pošle stejný nonce → BE vrátí původní výsledek místo 2. odečtu.
  const [clientNonce, setClientNonce] = useState(() => crypto.randomUUID());
  const defaultDate = useDefaultInGameDate(worldId);
  const [inGameDate, setInGameDate] = useState<FantasyDateLike>(defaultDate);

  // TanStack Query: fetch účtů cílové postavy. `enabled` rozhoduje o spuštění.
  const targetAccountsQuery = useQuery({
    queryKey: targetSlug
      ? charactersQueryKey.accountsByCharacter(worldId, targetSlug)
      : ['transfer-target-accounts-disabled'],
    queryFn: () =>
      api.get<CharacterAccount[]>(
        `/worlds/${worldId}/characters/${targetSlug}/accounts`,
      ),
    enabled: !!targetSlug,
    staleTime: 30_000,
  });

  const targetLoading = targetAccountsQuery.isLoading;
  const targetAccounts = targetSlug
    ? (targetAccountsQuery.data?.filter(
        (a) => a.id !== fromAccount.id && a.currency === fromAccount.currency,
      ) ?? null)
    : null;
  // Derived default — pokud user nevybral, použij první z compatible.
  const targetAccountId =
    targetAccountIdState ||
    (targetAccounts && targetAccounts.length > 0 ? targetAccounts[0].id : '');

  const canSubmit =
    !!targetAccountId &&
    amount > 0 &&
    !transfer.isPending &&
    !targetLoading &&
    targetAccountId !== fromAccount.id;

  function handleSubmit() {
    transfer.mutate(
      {
        toAccountId: targetAccountId,
        amount,
        description: description.trim() || 'Převod',
        inGameDate,
        clientNonce,
      },
      {
        onSuccess: () => {
          setClientNonce(crypto.randomUUID()); // další převod = nový záměr
          toast.success(`Posláno ${amount} ${fromAccount.currency}`);
          onTransferred();
        },
        onError: (err: unknown) => {
          const e = err as { response?: { data?: { error?: { code?: string } } } };
          const code = e?.response?.data?.error?.code;
          if (code === 'CURRENCY_MISMATCH')
            toast.error('Účty musí mít stejnou měnu');
          else if (code === 'AMOUNT_INVALID')
            toast.error('Částka musí být kladná');
          else if (code === 'TRANSFER_FAILED')
            toast.error('Převod se nezdařil, zkus to znovu');
          else toast.error('Převod selhal');
        },
      },
    );
  }

  const characters = directory.data ?? [];

  return (
    <Modal
      open
      onClose={onClose}
      title="Poslat peníze"
      footer={
        <>
          <button type="button" className={s.btnSecondary} onClick={onClose}>
            Zrušit
          </button>
          <button
            type="button"
            className={s.btnPrimary}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Poslat {amount > 0 ? `${amount} ${fromAccount.currency}` : ''}
          </button>
        </>
      }
    >
      <div className={s.modalBody}>
        <div className={s.transferFrom}>
          <span className={s.fieldLabel}>Z účtu</span>
          <strong>
            {fromAccount.label} ({fromAccount.balance} {fromAccount.currency})
          </strong>
        </div>

        <label className={s.field}>
          <span>Komu (postava)</span>
          <select
            className={s.input}
            value={targetSlug}
            onChange={(e) => setTargetSlug(e.target.value)}
          >
            <option value="">— vyber postavu —</option>
            {characters.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
                {c.isNpc ? ' (NPC)' : ''}
              </option>
            ))}
          </select>
        </label>

        {targetSlug && (
          <label className={s.field}>
            <span>Na účet</span>
            {targetLoading ? (
              <span className={s.muted}>Načítám účty…</span>
            ) : !targetAccounts || targetAccounts.length === 0 ? (
              <span className={s.warn}>
                Postava nemá kompatibilní účet ve stejné měně (
                {fromAccount.currency}).
              </span>
            ) : (
              <select
                className={s.input}
                value={targetAccountId}
                onChange={(e) => setTargetAccountIdState(e.target.value)}
              >
                {targetAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label} ({a.balance} {a.currency})
                  </option>
                ))}
              </select>
            )}
          </label>
        )}

        <label className={s.field}>
          <span>Částka ({fromAccount.currency})</span>
          <input
            type="number"
            className={s.input}
            min={1}
            value={amount || ''}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
          />
        </label>

        <label className={s.field}>
          <span>Popis (volitelné)</span>
          <input
            type="text"
            className={s.input}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Vrácení dluhu, výkupné, …"
          />
        </label>

        <InGameDateField
          value={inGameDate}
          onChange={setInGameDate}
          worldId={worldId}
          label="Herní datum převodu"
        />
      </div>
    </Modal>
  );
}
