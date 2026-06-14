import { toast } from 'sonner';
import { Modal, Button } from '@/shared/ui';
import {
  convertAmount,
  formatCurrency,
  getCurrencySymbol,
  type WorldCurrencyItem,
} from '@/features/world/currencies/shared';
import type { CharacterAccount } from '../../../api/characters.types';
import { useChangeAccountCurrency } from '../../../api/useCharacterAccounts';
import s from './ChangeCurrencyDialog.module.css';

interface Props {
  worldId: string;
  account: CharacterAccount;
  /** Nová měna (kód) zvolená v selectu. */
  targetCurrency: string;
  items: WorldCurrencyItem[];
  /** Zrušit — vrátí select na původní měnu. */
  onClose: () => void;
  /** Hotovo (přepočet i přeznačení). */
  onDone: () => void;
}

/**
 * 8.x currency-conversion — potvrzení změny měny účtu s náhledem převodu.
 *
 * „Přepočítat kurzem" přepočítá celý účet (zůstatek + historie + šablony) podle
 * kurzu ze světových měn. „Jen přeznačit" nechá čísla a změní jen symbol.
 * Když převod nelze (chybí kurz některé měny), nabídne jen přeznačení.
 */
export function ChangeCurrencyDialog({
  worldId,
  account,
  targetCurrency,
  items,
  onClose,
  onDone,
}: Props) {
  const mutation = useChangeAccountCurrency(worldId, account.id);
  const fromCode = account.currency;
  const converted = convertAmount(account.balance, fromCode, targetCurrency, items);
  const canConvert = converted !== null;

  const fromSymbol = getCurrencySymbol(fromCode, items) || fromCode;
  const toSymbol = getCurrencySymbol(targetCurrency, items) || targetCurrency;

  function run(convert: boolean) {
    mutation.mutate(
      { currency: targetCurrency, convert },
      {
        onSuccess: () => {
          toast.success(
            convert
              ? `Přepočítáno: ${formatCurrency(account.balance, fromCode, items)} → ${formatCurrency(converted ?? account.balance, targetCurrency, items)}`
              : 'Měna změněna (jen přeznačení).',
          );
          onDone();
        },
        onError: (err) => {
          const e = err as {
            response?: { data?: { code?: string; message?: string } };
          };
          if (e?.response?.data?.code === 'CURRENCY_RATE_MISSING')
            toast.error('Pro přepočet musí mít obě měny nastavený kurz.');
          else toast.error('Změna měny selhala.');
        },
      },
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Změna měny účtu"
      size="md"
      closeOnBackdrop={!mutation.isPending}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Zrušit
          </Button>
          <Button
            variant="secondary"
            onClick={() => run(false)}
            loading={mutation.isPending}
          >
            Jen přeznačit
          </Button>
          {canConvert && (
            <Button onClick={() => run(true)} loading={mutation.isPending}>
              Přepočítat kurzem
            </Button>
          )}
        </>
      }
    >
      <div className={s.body}>
        <p className={s.line}>
          <span className={s.muted}>Měna:</span>{' '}
          <strong>{fromSymbol}</strong> → <strong>{toSymbol}</strong>
        </p>

        {canConvert ? (
          <>
            <p className={s.line}>
              <span className={s.muted}>Zůstatek:</span>{' '}
              <strong>{formatCurrency(account.balance, fromCode, items)}</strong>{' '}
              → <strong>{formatCurrency(converted ?? 0, targetCurrency, items)}</strong>
            </p>
            <p className={s.note}>
              „Přepočítat kurzem" přepočítá i <strong>historii transakcí</strong>{' '}
              a šablony příjmů/výdajů. „Jen přeznačit" nechá čísla a změní jen
              symbol.
            </p>
          </>
        ) : (
          <p className={s.note}>
            Pro přepočet kurzem musí mít obě měny nastavený kurz ve světových
            měnách. Zatím lze měnu jen <strong>přeznačit</strong> (čísla
            zůstanou, změní se symbol).
          </p>
        )}
      </div>
    </Modal>
  );
}
