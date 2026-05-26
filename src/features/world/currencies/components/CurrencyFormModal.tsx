import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Modal } from '@/shared/ui/Modal/Modal';
import { Button } from '@/shared/ui/Button/Button';
import { Input } from '@/shared/ui/Input/Input';
import { useUpdateCurrencies } from '../api';
import type { WorldCurrencyItem } from '../types';
import {
  createCurrencyItemSchema,
  type CurrencyItemFormValues,
} from '../validation';
import s from './CurrencyFormModal.module.css';

interface CurrencyFormModalProps {
  worldId: string;
  items: WorldCurrencyItem[];
  mode: 'add' | 'edit';
  /** Required pro edit mode. */
  initial?: WorldCurrencyItem;
  onClose: () => void;
}

/**
 * Spec 11.4 §4.4 — modal pro přidání / úpravu jedné měny.
 *
 * Save = klient sestaví KOMPLETNÍ nový items array (zaměnit / přidat 1 položku)
 * a pošle PUT na BE (full-replace). Optimistic update v cache (api.ts).
 *
 * Edit base currency: rate input je disabled (vždy 1.0).
 */
export function CurrencyFormModal({
  worldId,
  items,
  mode,
  initial,
  onClose,
}: CurrencyFormModalProps) {
  const isEdit = mode === 'edit';
  const isBase = isEdit && initial?.code === items[0]?.code;
  const updateMutation = useUpdateCurrencies(worldId);
  const schema = createCurrencyItemSchema(items, initial?.code);

  const { register, handleSubmit, formState } =
    useForm<CurrencyItemFormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        code: initial?.code ?? '',
        name: initial?.name ?? '',
        symbol: initial?.symbol ?? '',
        rate: isBase ? 1.0 : (initial?.rate ?? 1.0),
      },
    });

  function onSubmit(values: CurrencyItemFormValues) {
    // Sestav nový items array
    const newItem: WorldCurrencyItem = {
      id: initial?.id,
      code: values.code,
      name: values.name,
      symbol: values.symbol ?? '',
      rate: isBase ? 1.0 : values.rate,
    };
    let nextItems: WorldCurrencyItem[];
    if (isEdit) {
      nextItems = items.map((i) => (i.code === initial?.code ? newItem : i));
    } else {
      nextItems = [...items, newItem];
    }
    updateMutation.mutate(
      { items: nextItems },
      {
        onSuccess: () => {
          toast.success(
            isEdit ? `Měna „${newItem.name}" uložena.` : `Měna „${newItem.name}" přidána.`,
          );
          onClose();
        },
        onError: (err) => {
          const msg =
            (err as Error & { response?: { data?: { message?: string } } })
              ?.response?.data?.message ?? 'Uložení selhalo.';
          toast.error(msg);
        },
      },
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? `Upravit měnu: ${initial?.name}` : 'Přidat měnu'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Zrušit
          </Button>
          <Button
            type="submit"
            form="currency-form"
            loading={updateMutation.isPending}
          >
            {isEdit ? 'Uložit' : 'Přidat'}
          </Button>
        </>
      }
    >
      <form
        id="currency-form"
        className={s.form}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <Input
          label="Kód (max 8 znaků, A-Z 0-9)"
          placeholder="ZL"
          maxLength={8}
          autoCapitalize="characters"
          error={formState.errors.code?.message}
          disabled={isBase}
          {...register('code', {
            setValueAs: (v: string) => v?.toUpperCase().trim() ?? '',
          })}
        />
        <Input
          label="Název"
          placeholder="Zlaťák"
          maxLength={40}
          error={formState.errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Symbol (volitelný)"
          placeholder="Zl"
          maxLength={8}
          error={formState.errors.symbol?.message}
          {...register('symbol')}
        />
        <Input
          label="Kurz (vůči základní měně)"
          type="number"
          step={0.0001}
          min={0.0001}
          max={1_000_000}
          disabled={isBase}
          error={formState.errors.rate?.message}
          {...register('rate', { valueAsNumber: true })}
        />
        {isBase && (
          <p className={s.note}>
            Základní měna má vždy kurz <strong>1.0</strong> a její kód se
            nedá změnit. Pokud chceš změnit základ, použij „Nastavit jako
            základ" u jiné měny.
          </p>
        )}
      </form>
    </Modal>
  );
}
