import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/shared/ui';
import { useCreateAccount } from '../../../api/useCharacterAccounts';
import type { WorldCurrencyItem } from '../../../api/characters.types';
import s from './accounts.module.css';

interface Props {
  worldId: string;
  characterSlug: string;
  currencies: WorldCurrencyItem[];
  onClose: () => void;
  onCreated: (accountId: string) => void;
}

/**
 * 8.6 — Modal pro vytvoření nového účtu postavě. Pokud svět nemá nastavené
 * měny, modal zobrazí hlášku „PJ musí nastavit měny" a disabled formulář
 * (Q8.4).
 */
export function CreateAccountModal({
  worldId,
  characterSlug,
  currencies,
  onClose,
  onCreated,
}: Props) {
  const create = useCreateAccount(worldId, characterSlug);
  const [label, setLabel] = useState('');
  const [currency, setCurrency] = useState(currencies[0]?.code ?? '');

  const noCurrencies = currencies.length === 0;
  const canSubmit = !!label.trim() && !!currency && !create.isPending;

  function handleSubmit() {
    create.mutate(
      { label: label.trim(), currency },
      {
        onSuccess: (account) => {
          toast.success('Účet vytvořen');
          onCreated(account.id);
        },
        onError: (err: unknown) => {
          const e = err as { response?: { data?: { error?: { code?: string } } } };
          const code = e?.response?.data?.error?.code;
          if (code === 'ACCOUNT_LIMIT_REACHED')
            toast.error('Postava dosáhla limitu 20 účtů');
          else toast.error('Vytvoření účtu selhalo');
        },
      },
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Nový účet"
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
            Vytvořit
          </button>
        </>
      }
    >
      <div className={s.modalBody}>
        {noCurrencies ? (
          <p className={s.warn}>
            Svět nemá nastavené měny. PJ je musí přidat ve světovém nastavení.
          </p>
        ) : (
          <>
            <label className={s.field}>
              <span>Název účtu</span>
              {/* eslint-disable jsx-a11y/no-autofocus -- autofocus na první pole je záměr: modal trapuje fokus */}
              <input
                type="text"
                className={s.input}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Osobní účet, Tajný fond, …"
                autoFocus
              />
              {/* eslint-enable jsx-a11y/no-autofocus */}
            </label>
            <label className={s.field}>
              <span>Měna</span>
              <select
                className={s.input}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>
    </Modal>
  );
}
