import { useEffect, useMemo, useState } from 'react';
import {
  CurrencyAmountInput,
  convertAmount,
  useUserPreferredCurrency,
} from '../shared';
import type { WorldCurrencyItem } from '../types';
import { useConvertMutation } from '../api';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';
import s from './ConverterSection.module.css';

interface ConverterSectionProps {
  worldId: string;
  items: WorldCurrencyItem[];
}

/**
 * Spec 11.4 §4.2 — sekce „Převodník".
 *
 * UX:
 *   - 2 řádky [amount + currency] propojené swap tlačítkem
 *   - Live recalc on change (debounce 250 ms → BE convert call pro autoritativní result)
 *   - Klient-side preview přes `convertAmount` util = instant UI bez round-tripu
 *   - Volba `to` měny se persistuje přes `useUserPreferredCurrency` per-world
 *     (Shop 11.3c později konzumuje stejnou preferenci)
 */
export function ConverterSection({ worldId, items }: ConverterSectionProps) {
  const { resolvedCode: preferredCode, setPreferred } = useUserPreferredCurrency(
    worldId,
    items,
  );

  // Base = první item v poli (UI invariant per spec §4.3)
  const baseCode = items[0]?.code ?? '';
  // Default `to` = preferovaná měna (z localStorage), fallback na první ne-base, fallback na base
  const defaultTo = useMemo(() => {
    if (preferredCode && preferredCode !== baseCode) return preferredCode;
    const nonBase = items.find((i) => i.code !== baseCode);
    return nonBase?.code ?? baseCode;
  }, [preferredCode, items, baseCode]);

  const [amount, setAmount] = useState<number | ''>(1);
  const [fromState, setFrom] = useState(baseCode);
  const [toState, setTo] = useState(defaultTo);

  // Derived: pokud se items mění (PJ smazal/přidal měnu), stale `from`/`to`
  // by ukazoval na neexistující code → resolvujeme přes baseCode/defaultTo
  // fallback bez setState v effectu (anti-pattern: cascading renders).
  const from = items.some((i) => i.code === fromState) ? fromState : baseCode;
  const to = items.some((i) => i.code === toState) ? toState : defaultTo;

  // Persist preferenci kdykoli user změní `to`
  function handleToChange(code: string) {
    setTo(code);
    setPreferred(code);
  }

  function handleSwap() {
    setFrom(to);
    setTo(from);
  }

  // Optimistic klient-side preview
  const numericAmount = typeof amount === 'number' ? amount : 0;
  const clientPreview = useMemo(
    () => convertAmount(numericAmount, from, to, items),
    [numericAmount, from, to, items],
  );

  // BE autoritativní výsledek — volá se debouncedly
  const debouncedAmount = useDebouncedValue(numericAmount, 250);
  const debouncedFrom = useDebouncedValue(from, 250);
  const debouncedTo = useDebouncedValue(to, 250);
  const convertMutation = useConvertMutation(worldId);

  useEffect(() => {
    if (
      !debouncedFrom ||
      !debouncedTo ||
      debouncedFrom === debouncedTo ||
      !Number.isFinite(debouncedAmount) ||
      debouncedAmount === 0
    ) {
      return;
    }
    if (!items.some((i) => i.code === debouncedFrom)) return;
    if (!items.some((i) => i.code === debouncedTo)) return;
    convertMutation.mutate({
      amount: debouncedAmount,
      from: debouncedFrom,
      to: debouncedTo,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedAmount, debouncedFrom, debouncedTo]);

  // Result = BE pokud máme čerstvý matching odpovídající aktuálnímu stavu, jinak klient preview
  const resultValue = useMemo(() => {
    const beResult = convertMutation.data;
    if (
      beResult &&
      beResult.from === from &&
      beResult.to === to &&
      beResult.amount === numericAmount
    ) {
      return beResult.result;
    }
    return clientPreview;
  }, [convertMutation.data, from, to, numericAmount, clientPreview]);

  // Edge cases
  if (items.length === 0) {
    return null; // nadřazený parent zobrazí empty state
  }
  if (items.length === 1) {
    return (
      <section className={s.section} aria-labelledby="converter-h">
        <h2 id="converter-h" className={s.heading}>
          Převodník
        </h2>
        <p className={s.note}>
          Tento svět má jen jednu měnu — převodník není potřeba.
        </p>
      </section>
    );
  }

  return (
    <section className={s.section} aria-labelledby="converter-h">
      <h2 id="converter-h" className={s.heading}>
        Převodník
      </h2>
      <div className={s.body}>
        <CurrencyAmountInput
          amount={amount}
          currencyCode={from}
          onAmountChange={setAmount}
          onCurrencyChange={setFrom}
          items={items}
          amountAriaLabel="Částka ke konverzi"
          currencyAriaLabel="Z měny"
        />
        <button
          type="button"
          className={s.swap}
          onClick={handleSwap}
          aria-label="Prohodit měny"
          title="Prohodit z/do"
        >
          ⇅
        </button>
        <CurrencyAmountInput
          amount={resultValue ?? ''}
          currencyCode={to}
          onAmountChange={() => {}}
          onCurrencyChange={handleToChange}
          items={items}
          readOnlyAmount
          amountAriaLabel="Výsledek"
          currencyAriaLabel="Do měny"
        />
      </div>
      {from === to && (
        <p className={s.hint}>Vyber různé měny pro převod.</p>
      )}
    </section>
  );
}
